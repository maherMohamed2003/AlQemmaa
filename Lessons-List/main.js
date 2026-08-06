const API = `${(window.APP_CONFIG && window.APP_CONFIG.API_BASE) || "https://abdomahne.runasp.net/api"}/Lesson`;
const SERVER_ROOT =
  (window.APP_CONFIG && window.APP_CONFIG.ROOT) ||
  "https://abdomahne.runasp.net";

const YEAR_LABELS = {
  1: "الصف الأول الإعدادي",
  2: "الصف الثاني الإعدادي",
  3: "الصف الثالث الإعدادي",
  4: "الصف الأول الثانوي",
  5: "الصف الثاني الثانوي",
  6: "الصف الثالث الثانوي",
};

let lessons = [];
let currentLessonId = 20;
let deleteLessonId = 20;
let currentUser = null;

const lessonsContainer = document.querySelector("#html");
const editModal = document.querySelector("#editModal");
const deleteModal = document.querySelector("#deleteModal");
const editForm = document.querySelector("#editModal form");

// ===============================
// روابط الفيديو: تحويل لصيغة قابلة للتضمين + استخراج صورة مصغّرة
// ===============================

// يحوّل روابط المشاركة الشائعة (يوتيوب، فيميو) إلى رابط تضمين (Embed) صالح للـ iframe.
function toEmbedUrl(url) {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch" && u.searchParams.get("v")) {
        return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
      }
      if (u.pathname.startsWith("/embed/")) return url;
    }

    if (u.hostname.includes("vimeo.com") && !u.hostname.includes("player")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }

    return url;
  } catch {
    return url;
  }
}

// يرجّع رابط صورة مصغّرة (Thumbnail) لو الرابط يوتيوب، أو null لأي مصدر تاني.
function getVideoThumbnail(url) {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }

    if (u.hostname.includes("youtube.com")) {
      const id =
        u.pathname === "/watch"
          ? u.searchParams.get("v")
          : u.pathname.startsWith("/embed/")
            ? u.pathname.split("/").pop()
            : null;
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }

    return null;
  } catch {
    return null;
  }
}

// أسماء الرولات المسموح لها بإضافة/تعديل/حذف الدروس (نفس المنطق المستخدم في باقي صفحات المنصة)
const STAFF_ROLES = ["معلم", "مبرمج"];
function isStaff() {
  try {
    if (typeof GNav !== "undefined" && GNav.isStaff && GNav.isStaff(currentUser)) {
      return true;
    }
  } catch (err) {}
  if (!currentUser) return false;
  const roles = []
    .concat(currentUser.role || [])
    .concat(currentUser.roles || [])
    .concat(currentUser.Role || [])
    .concat(currentUser.Roles || []);
  return roles.some((r) => STAFF_ROLES.includes(String(r).trim()));
}

function authHeaders() {
  return currentUser && currentUser.token
    ? { Authorization: `Bearer ${currentUser.token}` }
    : {};
}

window.onload = async () => {
  currentUser = GNav.requireLogin("../Login/login.html");
  if (!currentUser) return;

  GNav.mount("#gnavMount", "lessons");
  applyRoleVisibility();
  await LoadLessons();
};

function applyRoleVisibility() {
  // إضافة درس بيظهر بس للمعلم أو المبرمج
  document.querySelectorAll(".staff-only").forEach((el) => {
    el.style.display = isStaff() ? "" : "none";
  });
}

async function LoadLessons() {
  try {
    if (isStaff()) {
      const response = await fetch(`${API}/GetAllLessonsGroupedByYear`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Failed To Load Lessons");
      const groups = await response.json();
      lessons = groups.flatMap((g) => g.lessons || []);
      RenderGroupedLessons(groups);
    } else {
      const response = await fetch(`${API}/GetAllLessons/${currentUser.year}`);
      if (!response.ok) throw new Error("Failed To Load Lessons");
      lessons = await response.json();
      RenderLessons(lessons);
    }
  } catch (err) {
    console.log(err);
    alert("حدث خطأ أثناء تحميل الدروس");
  }
}

function lessonCardHtml(lesson) {
  const menu = isStaff()
    ? `
        <div class="lesson-menu">
            <button class="icon-btn edit-btn" type="button" onclick="OpenEditModal(${lesson.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
            </button>
            <button class="icon-btn danger" type="button" onclick="OpenDeleteModal(${lesson.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"/>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
            </button>
        </div>`
    : "";

  const embedUrl = toEmbedUrl(lesson.videoUrl);
  const videoFrame = embedUrl
    ? `<iframe src="${embedUrl}" loading="lazy" tabindex="-1" allow="encrypted-media" title="${lesson.title || ""}"></iframe>`
    : "";

  return `
        <article class="lesson-card">
            <button class="lesson-thumb" onclick="GoToLesson(${lesson.id})">
                ${videoFrame}
                <div class="thumb-play">
                    <svg viewBox="0 0 68 48" fill="none">
                        <path d="M66.5 7.7c-.8-2.9-2.9-5.2-5.8-6C55 0 34 0 34 0S13 0 7.3 1.7C4.4 2.5 2.3 4.8 1.5 7.7 0 13.4 0 24 0 24s0 10.6 1.5 16.3c.8 2.9 2.9 5.2 5.8 6C13 48 34 48 34 48s21 0 26.7-1.7c2.9-.8 5-3.1 5.8-6C68 34.6 68 24 68 24s0-10.6-1.5-16.3z" fill="rgba(220,40,40,.92)"/>
                        <path d="M45 24 27 14v20z" fill="#fff"/>
                    </svg>
                </div>
            </button>
            <div class="lesson-body">
                <div class="lesson-top">
                    <h3 class="lesson-title">${lesson.title}</h3>
                    ${menu}
                </div>
                <p class="lesson-desc">${lesson.description}</p>
            </div>
        </article>`;
}

function RenderLessons(list) {
  lessonsContainer.innerHTML = "";

  if (!list || list.length == 0) {
    lessonsContainer.innerHTML = `<div class="empty-state">لا توجد دروس مضافة حتى الآن.</div>`;
    return;
  }

  lessonsContainer.innerHTML = list.map(lessonCardHtml).join("");
}

function RenderGroupedLessons(groups) {
  lessonsContainer.innerHTML = "";

  const nonEmpty = (groups || []).filter((g) => g.lessons && g.lessons.length);

  if (nonEmpty.length === 0) {
    lessonsContainer.innerHTML = `<div class="empty-state">لا توجد دروس مضافة حتى الآن.</div>`;
    return;
  }

  lessonsContainer.innerHTML = nonEmpty
    .map(
      (g) => `
      <section class="year-group">
        <h2 class="year-group-title">${YEAR_LABELS[g.year] || `السنة ${g.year}`}</h2>
        <div class="year-group-grid">
          ${g.lessons.map(lessonCardHtml).join("")}
        </div>
      </section>`,
    )
    .join("");
}

function OpenEditModal(id) {
  if (!isStaff()) return;
  currentLessonId = id;

  const lesson = lessons.find((x) => x.id == id);

  if (!lesson) return;

  editForm.querySelector("[name='Id']").value = lesson.id;
  editForm.querySelector("[name='Title']").value = lesson.title;
  editForm.querySelector("[name='Description']").value = lesson.description;
  editForm.querySelector("[name='Year']").value =
    lesson.year || currentUser.year;

  editForm.querySelector("[name='VideoUrl']").value = lesson.videoUrl || "";

  editModal.style.display = "flex";
}

function CloseEditModal() {
  editModal.style.display = "none";
}

function OpenDeleteModal(id) {
  if (!isStaff()) return;
  deleteLessonId = id;

  deleteModal.style.display = "flex";
}

function CloseDeleteModal() {
  deleteModal.style.display = "none";
}
function setEditSaving(isSaving) {
  const btn = document.getElementById("saveEditBtn");
  const spinner = document.getElementById("saveEditSpinner");
  const text = document.getElementById("saveEditBtnText");
  if (!btn) return;
  btn.disabled = isSaving;
  if (spinner) spinner.hidden = !isSaving;
  if (text) text.textContent = isSaving ? "جارِ الحفظ..." : "حفظ التعديلات";
}

async function EditLesson() {
  setEditSaving(true);
  try {
    const response = await fetch(`${API}/UpdateLesson`, {
      method: "PUT",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: currentLessonId,
        title: editForm.Title.value,
        description: editForm.Description.value,
        year: editForm.Year.value,
        videoUrl: editForm.VideoUrl.value.trim(),
      }),
    });

    if (response.status === 401 || response.status === 403) {
      alert("مفيش صلاحية لتعديل الدروس — لازم تكون مسجل دخول كمعلم أو مبرمج");
      return;
    }

    if (!response.ok) throw new Error("Update Failed");

    // ملحوظة: UpdateLesson بترجع bool بس مش بيانات الدرس المحدث،
    // فبنعمل إعادة تحميل كاملة للدروس بدل ما نحاول نحدّث القيم يدويًا.
    CloseEditModal();
    window.location.reload();
  } catch (err) {
    console.log(err);

    alert("حدث خطأ أثناء تعديل الدرس");
  } finally {
    setEditSaving(false);
  }
}

async function DeleteLesson() {
  if (deleteLessonId == null) return;

  const btn = document.getElementById("confirmDeleteBtn");
  const spinner = document.getElementById("confirmDeleteSpinner");
  const text = document.getElementById("confirmDeleteBtnText");
  if (btn) btn.disabled = true;
  if (spinner) spinner.hidden = false;
  if (text) text.textContent = "جارِ الحذف...";

  try {
    const response = await fetch(`${API}/DeleteLessonById/${deleteLessonId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (response.status === 401 || response.status === 403) {
      alert("مفيش صلاحية لحذف الدروس — لازم تكون مسجل دخول كمعلم أو مبرمج");
      return;
    }

    if (!response.ok) throw new Error("Delete Failed");

    lessons = lessons.filter((x) => x.id != deleteLessonId);

    await LoadLessons();

    CloseDeleteModal();

    deleteLessonId = null;

    alert("تم حذف الدرس بنجاح");
  } catch (err) {
    console.log(err);

    alert("حدث خطأ أثناء حذف الدرس");
  } finally {
    if (btn) btn.disabled = false;
    if (spinner) spinner.hidden = true;
    if (text) text.textContent = "حذف نهائيًا";
  }
}

window.onclick = function (e) {
  if (e.target == editModal) CloseEditModal();

  if (e.target == deleteModal) CloseDeleteModal();
};

const themeSwitch = document.getElementById("themeSwitch");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeSwitch.checked = true;
}

themeSwitch.addEventListener("change", function () {
  if (this.checked) {
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
});

function GoToLesson(id) {
  localStorage.setItem("lessonId", id);
  window.location.href = "../Lesson-View/lesson-view.html";
}
