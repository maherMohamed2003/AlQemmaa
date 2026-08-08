const API = `${(window.APP_CONFIG && window.APP_CONFIG.API_BASE) || "https://abdomahne.runasp.net/api"}/User`;

const YEAR_LABELS = {
  1: "الصف الأول الإعدادي",
  2: "الصف الثاني الإعدادي",
  3: "الصف الثالث الإعدادي",
  4: "الصف الأول الثانوي",
  5: "الصف الثاني الثانوي",
  6: "الصف الثالث الثانوي",
};

const currentUser = GNav.requireLogin("../Login/login.html");
if (currentUser) GNav.mount("#gnavMount", "profile");

function isStaff() {
  return GNav.isStaff(currentUser);
}

// ---------- theme ----------
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
let theme = localStorage.getItem("theme") || "light";
root.setAttribute("data-theme", theme);
themeToggle.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme);
  root.setAttribute("data-theme", theme);
});

// ---------- elements ----------
const pAvatar = document.getElementById("pAvatar");
const pName = document.getElementById("pName");
const pRole = document.getElementById("pRole");
const pEmail = document.getElementById("pEmail");
const pPhone = document.getElementById("pPhone");
const pYear = document.getElementById("pYear");
const pYearRow = document.getElementById("pYearRow");

const editForm = document.getElementById("editForm");
const nameInput = document.getElementById("fName");
const yearInput = document.getElementById("fYear");
const phoneInput = document.getElementById("fPhone");
const yearField = document.getElementById("yearField");
const nameError = document.getElementById("nameError");
const phoneError = document.getElementById("phoneError");
const saveBtn = document.getElementById("saveBtn");
const formMessage = document.getElementById("formMessage");

function authHeaders() {
  return currentUser && currentUser.token
    ? {
        Authorization: `Bearer ${currentUser.token}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };
}

function renderInfo(user) {
  pAvatar.textContent = (user.name || "ط")[0];
  pName.textContent = user.name || "";
  pRole.textContent = isStaff() ? user.roleName : "طالب";
  pEmail.textContent = user.email || "—";
  pPhone.textContent = user.phone || "—";

  if (isStaff()) {
    pYearRow.style.display = "none";
    yearField.style.display = "none";
  } else {
    pYear.textContent = YEAR_LABELS[user.year] || "—";
  }

  nameInput.value = user.name || "";
  yearInput.value = user.year || 1;
  phoneInput.value = user.phone || "";
}

async function loadProfile() {
  // بيانات مبدئية من الجلسة الحالية، هيتم تحديثها بعد الرد من السيرفر
  renderInfo(currentUser);

  try {
    const res = await fetch(`${API}/GetUserById/${currentUser.id}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const user = await res.json();
    renderInfo(user);
  } catch (err) {
    console.log(err);
  }
}
loadProfile();

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  nameError.textContent = "";
  phoneError.textContent = "";
  formMessage.className = "form-message";

  let ok = true;
  if (!nameInput.value.trim()) {
    nameError.textContent = "من فضلك أدخل اسمك";
    ok = false;
  }
  if (!phoneInput.value.trim()) {
    phoneError.textContent = "من فضلك أدخل رقم هاتفك";
    ok = false;
  }
  if (!ok) return;

  saveBtn.disabled = true;

  try {
    const res = await fetch(`${API}/EditUser`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        id: currentUser.id,
        name: nameInput.value.trim(),
        Year: Number(yearInput.value) || currentUser.year,
        phone: phoneInput.value.trim(),
      }),
    });

    if (!res.ok) {
      formMessage.className = "form-message show error";
      formMessage.textContent = "حصل خطأ أثناء حفظ التعديلات، حاول تاني.";
      return;
    }

    // حدّث بيانات الجلسة المحفوظة محليًا عشان الاسم يتغيّر في الناف بار كمان
    const updatedUser = {
      ...currentUser,
      name: nameInput.value.trim(),
      year: Number(yearInput.value) || currentUser.year,
      phone: phoneInput.value.trim(),
    };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    renderInfo(updatedUser);

    formMessage.className = "form-message show success";
    formMessage.textContent = "تم حفظ بياناتك بنجاح.";
  } catch (err) {
    console.log(err);
    formMessage.className = "form-message show error";
    formMessage.textContent = "تعذر الاتصال بالسيرفر، تأكد من الإنترنت وحاول تاني.";
  } finally {
    saveBtn.disabled = false;
  }
});
