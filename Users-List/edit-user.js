const API = `${(window.APP_CONFIG && window.APP_CONFIG.API_BASE) || "https://abdomahne.runasp.net/api"}/User`;

const currentUser = GNav.requireStaff("../Home/home.html");
if (currentUser) GNav.mount("#gnavMount", "dashboard");

const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

const loadingRow = document.getElementById("loadingRow");
const editForm = document.getElementById("editForm");
const userSub = document.getElementById("userSub");
const nameInput = document.getElementById("fName");
const yearInput = document.getElementById("fYear");
const phoneInput = document.getElementById("fPhone");
const nameError = document.getElementById("nameError");
const phoneError = document.getElementById("phoneError");
const saveBtn = document.getElementById("saveBtn");
const formMsg = document.getElementById("formMsg");

function authHeaders() {
  return currentUser && currentUser.token
    ? {
        Authorization: `Bearer ${currentUser.token}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };
}

function setMsg(kind, text) {
  formMsg.className = `form-msg show ${kind}`;
  formMsg.textContent = text;
}

async function loadUser() {
  if (!userId) {
    userSub.textContent = "لم يتم تحديد مستخدم للتعديل.";
    return;
  }

  try {
    const res = await fetch(`${API}/GetUserById/${userId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Not Found");
    const user = await res.json();

    userSub.textContent = `تعديل بيانات: ${user.name}`;
    nameInput.value = user.name || "";
    yearInput.value = user.year || 1;
    phoneInput.value = user.phone || "";

    loadingRow.style.display = "none";
    editForm.style.display = "block";
  } catch (err) {
    console.log(err);
    userSub.textContent = "تعذّر تحميل بيانات المستخدم.";
    loadingRow.innerHTML = `<div style="color:var(--danger)">حصل خطأ أثناء تحميل بيانات المستخدم، جرب ترجع لقائمة المستخدمين وتفتح التعديل تاني.</div>`;
  }
}
loadUser();

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  nameError.textContent = "";
  phoneError.textContent = "";
  formMsg.className = "form-msg";

  let ok = true;
  if (!nameInput.value.trim()) {
    nameError.textContent = "من فضلك أدخل الاسم";
    ok = false;
  }
  if (!phoneInput.value.trim()) {
    phoneError.textContent = "من فضلك أدخل رقم الهاتف";
    ok = false;
  }
  if (!ok) return;

  saveBtn.disabled = true;

  try {
    const res = await fetch(`${API}/EditUser`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        id: Number(userId),
        name: nameInput.value.trim(),
        Year: Number(yearInput.value),
        phone: phoneInput.value.trim(),
      }),
    });

    if (res.status === 401 || res.status === 403) {
      setMsg("error", "مفيش صلاحية لتعديل بيانات المستخدمين.");
      return;
    }

    if (!res.ok) {
      setMsg("error", "حصل خطأ أثناء حفظ التعديلات، حاول تاني.");
      return;
    }

    setMsg("success", "تم حفظ التعديلات بنجاح.");
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 900);
  } catch (err) {
    console.log(err);
    setMsg("error", "تعذر الاتصال بالسيرفر، تأكد من الإنترنت وحاول تاني.");
  } finally {
    saveBtn.disabled = false;
  }
});
