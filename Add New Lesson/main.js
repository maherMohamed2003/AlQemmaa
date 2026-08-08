// ---------- auth guard ----------
const currentUser = GNav.requireStaff("../Home/home.html");
if (currentUser) GNav.mount("#gnavMount", "addLesson");

// ---------- theme ----------
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

let theme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
root.setAttribute("data-theme", theme);

themeToggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", theme);
});

// =============================
// Upload Config
// =============================

const API_BASE =
  (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ||
  "https://abdomahne.runasp.net/api";

// =============================
// Elements
// =============================

const videoUrlInput = document.getElementById("lessonVideoUrl");

const videoPreview = document.getElementById("videoPreview");
const videoPreviewEl = document.getElementById("videoPreviewEl");

const videoField = document.getElementById("videoField");
const videoError = document.getElementById("videoError");

const form = document.getElementById("addLessonForm");

const titleInput = document.getElementById("lessonTitle");
const descInput = document.getElementById("lessonDesc");
const yearInput = document.getElementById("lessonYear");

const titleField = document.getElementById("titleField");
const descField = document.getElementById("descField");
const yearField = document.getElementById("yearField");

const submitBtn = document.getElementById("submitBtn");
const submitSpinner = document.getElementById("submitSpinner");
const submitBtnText = submitBtn.querySelector(".btn-text");

const formMessage = document.getElementById("formMessage");
const successCard = document.getElementById("successCard");

let videoUrl = "";

// =============================
// Helpers
// =============================

// Convert common share links (YouTube, Vimeo) into embeddable iframe URLs.
// Any other link is used as-is (assumed already embeddable / direct video file).
function toEmbedUrl(url) {
  try {
    const u = new URL(url);

    // youtu.be/VIDEOID
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }

    // youtube.com/watch?v=VIDEOID
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch" && u.searchParams.get("v")) {
        return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
      }
      if (u.pathname.startsWith("/embed/")) return url;
    }

    // vimeo.com/VIDEOID
    if (u.hostname.includes("vimeo.com") && !u.hostname.includes("player")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }

    return url;
  } catch {
    return url;
  }
}

function setVideoUrl(url) {
  const trimmed = url.trim();

  if (!trimmed) {
    clearVideoUrl();
    return;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    videoField.classList.add("invalid");
    videoError.textContent = "الرابط غير صالح";
    videoPreview.classList.remove("show");
    videoUrl = "";
    return;
  }

  videoUrl = trimmed;

  videoPreviewEl.src = toEmbedUrl(trimmed);

  videoPreview.classList.add("show");

  videoError.textContent = "";

  videoField.classList.remove("invalid");
}

function clearVideoUrl() {
  videoUrl = "";

  videoPreviewEl.src = "";

  videoPreview.classList.remove("show");
}

videoUrlInput.addEventListener("input", () => setVideoUrl(videoUrlInput.value));

// =============================
// Validation
// =============================

function clearErrors() {
  [titleField, descField, yearField, videoField].forEach((x) =>
    x.classList.remove("invalid"),
  );

  document.getElementById("titleError").textContent = "";
  document.getElementById("descError").textContent = "";
  document.getElementById("yearError").textContent = "";
  videoError.textContent = "";

  formMessage.className = "form-message";
  formMessage.textContent = "";
}

function validate() {
  clearErrors();

  let ok = true;

  if (!titleInput.value.trim()) {
    ok = false;

    titleField.classList.add("invalid");

    document.getElementById("titleError").textContent = "أدخل عنوان الدرس";
  }

  if (!descInput.value.trim()) {
    ok = false;

    descField.classList.add("invalid");

    document.getElementById("descError").textContent = "أدخل وصف الدرس";
  }

  if (!videoUrl) {
    ok = false;

    videoField.classList.add("invalid");

    videoError.textContent = "أدخل رابط الفيديو";
  }

  if (!yearInput.value) {
    ok = false;

    yearField.classList.add("invalid");

    document.getElementById("yearError").textContent = "اختر الصف";
  }

  return ok;
}

function setSubmitting(value) {
  submitBtn.disabled = value;

  submitSpinner.hidden = !value;

  submitBtnText.textContent = value ? "جارٍ النشر..." : "نشر الدرس";
}
// =======================================
// Add Lesson
// =======================================

async function addLesson() {
  const response = await fetch(`${API_BASE}/Lesson/AddLesson`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Authorization: "Bearer " + currentUser.token,
    },

    body: JSON.stringify({
      title: titleInput.value.trim(),

      description: descInput.value.trim(),

      year: parseInt(yearInput.value),

      userId: 2,

      videoLink: videoUrl,
    }),
  });

  if (!response.ok) throw new Error("فشل فى إضافة الدرس");

  return await response.json();
}

// =======================================
// Submit Form
// =======================================

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!validate()) return;

  try {
    setSubmitting(true);

    // Add Lesson (video is sent as a link, no file upload needed)
    await addLesson();

    // Success

    form.style.display = "none";

    successCard.classList.add("show");
  } catch (error) {
    console.error(error);

    formMessage.textContent = error.message || "حدث خطأ أثناء رفع الفيديو";

    formMessage.className = "form-message show error";
  } finally {
    setSubmitting(false);
  }
});

// =======================================
// Add Another Lesson
// =======================================

document.getElementById("addAnotherBtn").addEventListener("click", () => {
  form.reset();

  clearErrors();

  clearVideoUrl();

  form.style.display = "flex";

  form.style.flexDirection = "column";

  successCard.classList.remove("show");
});
