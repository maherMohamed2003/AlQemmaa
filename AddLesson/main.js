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

const CHUNK_SIZE = 20 * 1024 * 1024; //20MB

// =============================
// Elements
// =============================

const dropzone = document.getElementById("dropzone");
const videoInput = document.getElementById("videoInput");

const fileChip = document.getElementById("fileChip");
const fileChipName = document.getElementById("fileChipName");
const fileChipSize = document.getElementById("fileChipSize");
const fileChipRemove = document.getElementById("fileChipRemove");

const videoPreview = document.getElementById("videoPreview");
const videoPreviewEl = document.getElementById("videoPreviewEl");

const videoField = document.getElementById("videoField");
const videoError = document.getElementById("videoError");

const uploadProgress = document.getElementById("uploadProgress");
const uploadProgressBar = document.getElementById("uploadProgressBar");

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

let selectedFile = null;
let previewUrl = null;

// =============================
// Helpers
// =============================

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " بايت";

  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";

  if (bytes < 1024 * 1024 * 1024)
    return (bytes / 1024 / 1024).toFixed(1) + " MB";

  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

function setFile(file) {
  if (!file) return;

  if (!file.type.startsWith("video/")) {
    videoField.classList.add("invalid");
    videoError.textContent = "من فضلك اختر ملف فيديو";

    return;
  }

  selectedFile = file;

  fileChip.classList.add("show");

  fileChipName.textContent = file.name;

  fileChipSize.textContent = formatSize(file.size);

  dropzone.style.display = "none";

  if (previewUrl) URL.revokeObjectURL(previewUrl);

  previewUrl = URL.createObjectURL(file);

  videoPreview.classList.add("show");

  videoPreviewEl.src = previewUrl;

  videoError.textContent = "";

  videoField.classList.remove("invalid");
}

function clearFile() {
  selectedFile = null;

  videoInput.value = "";

  fileChip.classList.remove("show");

  dropzone.style.display = "flex";

  videoPreview.classList.remove("show");

  if (previewUrl) URL.revokeObjectURL(previewUrl);

  previewUrl = null;
}

dropzone.onclick = () => videoInput.click();

videoInput.onchange = () => setFile(videoInput.files[0]);

fileChipRemove.onclick = clearFile;

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

  if (!selectedFile) {
    ok = false;

    videoField.classList.add("invalid");

    videoError.textContent = "اختر فيديو";
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

  submitBtnText.textContent = value ? "جارى رفع الفيديو..." : "نشر الدرس";
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

      userId: currentUser.id,
    }),
  });

  if (!response.ok) throw new Error("فشل فى إضافة الدرس");

  return await response.json();
}

// =======================================
// Start Upload
// =======================================

async function startUpload(file) {
  const response = await fetch(`${API_BASE}/Lesson/start-upload`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Authorization: "Bearer " + currentUser.token,
    },

    body: JSON.stringify({
      fileName: file.name,
    }),
  });

  if (!response.ok) throw new Error("Start Upload Failed");

  return await response.json();
}

// =======================================
// Upload One Chunk
// =======================================

async function uploadChunk(fileId, chunk, chunkIndex, totalChunks) {
  const formData = new FormData();

  formData.append("Chunk", chunk);

  formData.append("FileId", fileId);

  formData.append("ChunkIndex", chunkIndex);

  formData.append("TotalChunks", totalChunks);

  const response = await fetch(`${API_BASE}/Lesson/upload-chunk`, {
    method: "POST",

    headers: {
      Authorization: "Bearer " + currentUser.token,
    },

    body: formData,
  });

  if (!response.ok) throw new Error("Chunk Upload Failed");
}

// =======================================
// Complete Upload
// =======================================

async function completeUpload(lessonId, fileId, fileName, totalChunks) {
  const response = await fetch(`${API_BASE}/Lesson/complete-upload`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Authorization: "Bearer " + currentUser.token,
    },

    body: JSON.stringify({
      lessonId: lessonId,

      fileId: fileId,

      fileName: fileName,

      totalChunks: totalChunks,
    }),
  });

  if (!response.ok) throw new Error("Complete Upload Failed");

  return await response.json();
}

// =======================================
// Upload Video
// =======================================

async function uploadVideo(file, lessonId) {
  const start = await startUpload(file);

  const fileId = start.fileId;

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  uploadProgress.classList.add("show");

  for (let i = 0; i < totalChunks; i++) {
    const startByte = i * CHUNK_SIZE;

    const endByte = Math.min(startByte + CHUNK_SIZE, file.size);

    const chunk = file.slice(startByte, endByte);

    await uploadChunk(
      fileId,

      chunk,

      i,

      totalChunks,
    );

    const percent = Math.round(((i + 1) / totalChunks) * 100);

    uploadProgressBar.style.width = percent + "%";
  }

  return await completeUpload(
    lessonId,

    fileId,

    file.name,

    totalChunks,
  );
}
// =======================================
// Submit Form
// =======================================

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!validate()) return;

  try {
    setSubmitting(true);

    uploadProgress.classList.remove("show");
    uploadProgressBar.style.width = "0%";

    // 1- Add Lesson
    const lesson = await addLesson();

    // 2- Upload Video
    await uploadVideo(
      selectedFile,

      lesson.id,
    );

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

  clearFile();

  uploadProgress.classList.remove("show");

  uploadProgressBar.style.width = "0%";

  form.style.display = "flex";

  form.style.flexDirection = "column";

  successCard.classList.remove("show");
});
