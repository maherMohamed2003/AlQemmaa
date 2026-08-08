const API_URL = `${(window.APP_CONFIG && window.APP_CONFIG.API_BASE) || "https://abdomahne.runasp.net/api"}/Post/AddNewPost`;

const currentUser = GNav.requireStaff("../Home/home.html");
if (currentUser) GNav.mount("#gnavMount", "addPost");

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

// ---------- form ----------
const form = document.getElementById("addPostForm");
const contentInput = document.getElementById("postContent");
const contentField = document.getElementById("contentField");
const contentError = document.getElementById("contentError");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");
const formCard = document.getElementById("formCard");
const successCard = document.getElementById("successCard");
const addAnotherBtn = document.getElementById("addAnotherBtn");

function clearErrors() {
  contentField.classList.remove("invalid");
  contentError.textContent = "";
  formMessage.className = "form-message";
  formMessage.textContent = "";
}

function setMessage(kind, text) {
  formMessage.className = `form-message show ${kind}`;
  formMessage.textContent = text;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const content = contentInput.value.trim();
  if (!content) {
    contentField.classList.add("invalid");
    contentError.textContent = "من فضلك اكتب محتوى البوست";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.classList.add("loading");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.token}`,
      },
      body: JSON.stringify({
        content: content,
        userId: currentUser.id,
      }),
    });

    if (res.status === 401 || res.status === 403) {
      setMessage(
        "error",
        "مفيش صلاحية لإضافة بوست — لازم تكون مسجل دخول كمعلم أو مبرمج",
      );
      return;
    }

    if (!res.ok) {
      setMessage("error", "حصل خطأ أثناء نشر البوست، حاول تاني.");
      return;
    }

    form.style.display = "none";
    successCard.classList.add("show");
  } catch (err) {
    console.log(err);
    setMessage("error", "تعذر الاتصال بالسيرفر، تأكد من الإنترنت وحاول تاني.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
  }
});

addAnotherBtn.addEventListener("click", () => {
  contentInput.value = "";
  clearErrors();
  successCard.classList.remove("show");
  form.style.display = "block";
});
