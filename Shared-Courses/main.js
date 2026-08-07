const API = `${(window.APP_CONFIG && window.APP_CONFIG.API_BASE) || "https://abdomahne.runasp.net/api"}/SharedCourses`;
const SERVER_ROOT =
  (window.APP_CONFIG && window.APP_CONFIG.ROOT) ||
  "https://abdomahne.runasp.net";

let courses = [];
let currentCourseId = null;
let deleteCourseId = null;
let currentUser = null;

const coursesContainer = document.querySelector("#html");
const editModal = document.querySelector("#editModal");
const deleteModal = document.querySelector("#deleteModal");
const videoModal = document.querySelector("#videoModal");
const editForm = document.querySelector("#editModal form");

// ===============================
// روابط الفيديو: تحويل لصيغة قابلة للتضمين + استخراج صورة مصغّرة
// ===============================

// يحوّل روابط المشاركة الشائعة (يوتيوب، فيميو) إلى رابط تضمين (Embed) صالح للـ iframe.
// ملاحظة: بنضيف fs=0 عشان نمنع اليوتيوب من الدخول في وضع Fullscreen خالص،
// وده بيمنع ظهور الـ menu اللي بيظهر جوه اليوتيوب في وضع الفول سكرين
// (زر Fullscreen بيختفي تمامًا من الكونترولز عشان اليوزر ميقدرش يدخل الوضع ده أصلاً).
function toEmbedUrl(url) {
  try {
    const u = new URL(url);

    // enablejsapi=1 و origin مطلوبين عشان نقدر نستخدم YouTube IFrame Player API
    // ونسمع لحدث "بدأ التشغيل" عشان نخفي الشريط وقتها
    const jsApiOrigin = encodeURIComponent(window.location.origin);

    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}?controls=1&fs=0&rel=0&modestbranding=1&enablejsapi=1&origin=${jsApiOrigin}`;
    }

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch" && u.searchParams.get("v")) {
        const id = u.searchParams.get("v");
        return `https://www.youtube.com/embed/${id}?controls=1&fs=0&rel=0&modestbranding=1&enablejsapi=1&origin=${jsApiOrigin}`;
      }
      if (u.pathname.startsWith("/embed/")) {
        // نضمن وجود نفس الباراميترات حتى لو الرابط جاي أصلاً بصيغة embed
        u.searchParams.set("fs", "0");
        u.searchParams.set("rel", "0");
        u.searchParams.set("modestbranding", "1");
        u.searchParams.set("enablejsapi", "1");
        u.searchParams.set("origin", window.location.origin);
        if (!u.searchParams.has("controls")) u.searchParams.set("controls", "1");
        return u.toString();
      }
    }

    if (u.hostname.includes("vimeo.com") && !u.hostname.includes("player")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}?controls=1`;
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

const STAFF_ROLES = ["معلم", "مبرمج"];

function isStaff() {
  try {
    if (
      typeof GNav !== "undefined" &&
      GNav.isStaff &&
      GNav.isStaff(currentUser)
    ) {
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

// ===============================
// نظام التنبيهات (Toasts)
// ===============================

const toastContainer = document.querySelector("#toastContainer");

const TOAST_ICONS = {
  success:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  error:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  warning:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
};

const TOAST_TITLES = {
  success: "تم بنجاح",
  error: "حدث خطأ",
  warning: "تنبيه",
  info: "معلومة",
};

function showToast(message, type = "info", opts = {}) {
  if (!toastContainer) return { update: () => {}, close: () => {} };

  const { title, duration = 4500, progress = false } = opts;

  const toastEl = document.createElement("div");
  toastEl.className = `toast ${type}`;
  toastEl.setAttribute("role", "status");

  toastEl.innerHTML = `
    <div class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</div>
    <div class="toast-body">
      <p class="toast-title">${title || TOAST_TITLES[type] || TOAST_TITLES.info}</p>
      <p class="toast-msg">${message}</p>
      ${
        progress
          ? `<div class="toast-upload-bar-track">
               <div class="toast-upload-bar-fill" style="width:0%"></div>
             </div>
             <span class="toast-upload-pct">0%</span>`
          : ""
      }
    </div>
    <button type="button" class="toast-close" aria-label="إغلاق">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    ${
      duration > 0 && !progress
        ? `<div class="toast-progress"><div class="toast-progress-bar" style="animation-duration:${duration}ms"></div></div>`
        : ""
    }
  `;

  toastContainer.appendChild(toastEl);

  let closed = false;
  let autoHideTimer = null;

  function close() {
    if (closed) return;
    closed = true;
    clearTimeout(autoHideTimer);
    toastEl.classList.add("toast-out");
    setTimeout(() => toastEl.remove(), 280);
  }

  toastEl.querySelector(".toast-close").addEventListener("click", close);

  if (duration > 0 && !progress) {
    autoHideTimer = setTimeout(close, duration);
  }

  function update(pct) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    const fill = toastEl.querySelector(".toast-upload-bar-fill");
    const label = toastEl.querySelector(".toast-upload-pct");
    if (fill) fill.style.width = `${clamped}%`;
    if (label) label.textContent = `${clamped}%`;
  }

  return { update, close };
}

window.onload = async () => {
  currentUser = GNav.requireLogin("../Login/login.html");
  if (!currentUser) return;

  GNav.mount("#gnavMount", "sharedCourses");
  applyRoleVisibility();
  await LoadCourses();
};

function applyRoleVisibility() {
  document.querySelectorAll(".staff-only").forEach((el) => {
    el.style.display = isStaff() ? "" : "none";
  });
}

async function LoadCourses() {
  try {
    const response = await fetch(`${API}/GetAllSharedCourses`, {
      headers: authHeaders(),
    });

    if (response.status === 404) {
      courses = [];
      RenderCourses(courses);
      return;
    }

    if (!response.ok) throw new Error("Failed To Load Shared Courses");

    courses = await response.json();
    RenderCourses(courses);
  } catch (err) {
    console.log(err);
    showToast("تعذّر تحميل الكورسات المشتركة، حاول مرة أخرى.", "error");
  }
}

function courseCardHtml(course) {
  const menu = isStaff()
    ? `
        <div class="lesson-menu">
            <button class="icon-btn edit-btn" type="button" onclick="OpenEditModal(${course.id})">
                ✏️
            </button>
            <button class="icon-btn danger" type="button" onclick="OpenDeleteModal(${course.id})">
                🗑️
            </button>
        </div>`
    : "";

  const embedUrl = toEmbedUrl(course.videoLink);
  const videoFrame = embedUrl
    ? `<iframe src="${embedUrl}" loading="lazy" tabindex="-1" allow="encrypted-media" title="${course.title || ""}"></iframe>`
    : "";

  return `
        <article class="lesson-card">
            <button class="lesson-thumb" onclick="OpenVideoModal(${course.id})">
                ${videoFrame}
                <span class="thumb-play">
                  <svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="11" fill="rgba(10,15,14,0.55)"/><path d="M10 8.5l6 3.5-6 3.5z"/></svg>
                </span>
            </button>

            <div class="lesson-body">
                <div class="lesson-top">
                    <h3 class="lesson-title">${course.title}</h3>
                    ${menu}
                </div>

                <p>${course.description || ""}</p>

                <span class="uploader-tag">
                    بواسطة: ${course.userName || "-"}
                </span>
            </div>
        </article>`;
}

function RenderCourses(list) {
  coursesContainer.innerHTML = "";

  if (!list || list.length === 0) {
    coursesContainer.innerHTML =
      "<div class='empty-state'>لا توجد كورسات مشتركة.</div>";
    return;
  }

  coursesContainer.innerHTML = list.map(courseCardHtml).join("");
}

function OpenVideoModal(id) {
  const course = courses.find((x) => x.id == id);
  if (!course) return;

  const player = document.getElementById("videoModalPlayer");

  // تم إرجاع الكونترولز ليوتيوب هنا (وبدون زر Fullscreen بسبب fs=0 في toEmbedUrl)
  player.src = toEmbedUrl(course.videoLink);

  document.getElementById("videoModalTitle").textContent = course.title;
  document.getElementById("videoModalDesc").textContent =
    course.description || "";

  document.getElementById("videoModalUploader").textContent =
    "بواسطة: " + (course.userName || "-");

  videoModal.style.display = "flex";
  
  wireVideoModalProtection();
  ensureVideoOverlayBar();
  loadYouTubeApi(attachYtPlayer);
}

// ===============================
// شريط تغطية فوق منطقة معيّنة من الـ iframe (تحت بار الوقت)
// بما إننا مش قادرين نلمس أي حاجة جوه iframe اليوتيوب (Cross-Origin)،
// الحل الوحيد إننا نحط عنصر فوقه من برّه يغطي البيكسلات دي بالكامل.
// ===============================
function ensureVideoOverlayBar() {
  const player = document.getElementById("videoModalPlayer");
  if (!player) return;

  // نلف الـ iframe بـ wrapper مرة واحدة بس (عشان نقدر نحط الشريط فوقه بالظبط)
  let wrapper = player.parentElement;
  if (!wrapper.classList.contains("video-player-wrap")) {
    wrapper = document.createElement("div");
    wrapper.className = "video-player-wrap";
    wrapper.style.position = "relative";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    player.parentNode.insertBefore(wrapper, player);
    wrapper.appendChild(player);
  }

  let bar = document.getElementById("videoModalHideBar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "videoModalHideBar";
    wrapper.appendChild(bar);
  }

  // ====== عدّل القيم دي لحد ما الشريط يظبط بالظبط على المنطقة المطلوبة ======
  bar.style.position = "absolute";
  bar.style.left = "0";
  bar.style.right = "0";
  bar.style.bottom = "0";       // المسافة من تحت الـ iframe (لو عايز تبعده عن الحافة زوّد الرقم)
  bar.style.height = "46px";    // ارتفاع الشريط - ده اللي هيحدد قد إيه هيغطي
  bar.style.background = "red"; // لون مؤقت للتجربة، غيّره بعدين ليطابق خلفية البلاير
  bar.style.zIndex = "5";
  bar.style.pointerEvents = "none"; // خليها "auto" لو عايز كمان تمنع الضغط على المنطقة دي
  bar.style.display = "block"; // نتأكد إنه ظاهر تاني كل ما نفتح فيديو جديد
}

function CloseVideoModal() {
  const player = document.getElementById("videoModalPlayer");

  if (ytPlayerInstance && typeof ytPlayerInstance.destroy === "function") {
    ytPlayerInstance.destroy();
  }
  ytPlayerInstance = null;

  player.src = "";
  videoModal.style.display = "none";
}

// ===============================
// YouTube IFrame Player API
// بنستخدمها بس عشان نعرف لما الفيديو "يبدأ التشغيل" فعليًا
// (postMessage رسمي من يوتيوب، مش وصول مباشر لعناصر الـ iframe)
// ===============================
let ytPlayerInstance = null;

function loadYouTubeApi(callback) {
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }

  if (!document.getElementById("youtube-iframe-api")) {
    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }

  const prevReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    if (typeof prevReady === "function") prevReady();
    callback();
  };
}

function attachYtPlayer() {
  const player = document.getElementById("videoModalPlayer");
  if (!player || !player.src.includes("youtube.com/embed")) return;

  if (ytPlayerInstance && typeof ytPlayerInstance.destroy === "function") {
    ytPlayerInstance.destroy();
    ytPlayerInstance = null;
  }

  ytPlayerInstance = new YT.Player("videoModalPlayer", {
    events: {
      onStateChange: function (e) {
        // 1 = PLAYING
        if (e.data === 1) {
          const bar = document.getElementById("videoModalHideBar");
          if (bar) bar.style.display = "none";
        }
      },
    },
  });
}

// ===============================
// حماية فيديو الكورس المشترك 
// ===============================
let videoModalProtectionWired = false;
function wireVideoModalProtection() {
  const box = document.getElementById("videoModalBox");
  const player = document.getElementById("videoModalPlayer");
  const watermark = document.getElementById("videoModalWatermark");
  const watermarkFloat = document.getElementById("videoModalWatermarkFloat");
  if (!box || !player) return;

  const wmText = currentUser
    ? `${currentUser.name || ""} • ${currentUser.email || currentUser.id}`
    : "";
  if (watermark) watermark.textContent = wmText;
  if (watermarkFloat) watermarkFloat.textContent = wmText;

  if (videoModalProtectionWired) return;
  videoModalProtectionWired = true;

  box.addEventListener("contextmenu", (e) => e.preventDefault());

  document.addEventListener("keydown", (e) => {
    if (videoModal.style.display !== "flex") return;
    const key = (e.key || "").toLowerCase();
    const blockCombo =
      (e.ctrlKey || e.metaKey) && ["s", "u", "p"].includes(key);
    const blockDevTools =
      key === "f12" ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key));
    if (blockCombo || blockDevTools) e.preventDefault();
  });

  const DEVTOOLS_THRESHOLD = 170;
  let devtoolsOpen = false;
  setInterval(() => {
    if (videoModal.style.display !== "flex") return;
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const isOpen =
      widthDiff > DEVTOOLS_THRESHOLD || heightDiff > DEVTOOLS_THRESHOLD;
    if (isOpen !== devtoolsOpen) {
      devtoolsOpen = isOpen;
      box.classList.toggle("dev-blur", devtoolsOpen);
    }
  }, 1000);
}

function OpenAddModal() {
  if (!isStaff()) {
    showToast("ليس لديك صلاحية لتنفيذ هذا الإجراء.", "warning");
    return;
  }
  currentCourseId = null;

  editForm.reset();

  editForm.Id.value = "";

  document.getElementById("editModalTitle").textContent = "إضافة كورس مشترك";

  editModal.style.display = "flex";
}

function OpenEditModal(id) {
  if (!isStaff()) {
    showToast("ليس لديك صلاحية لتنفيذ هذا الإجراء.", "warning");
    return;
  }
  currentCourseId = id;

  const course = courses.find((x) => x.id == id);

  if (!course) return;

  editForm.Id.value = course.id;
  editForm.Title.value = course.title;
  editForm.Description.value = course.description || "";
  editForm.VideoUrl.value = course.videoLink || "";

  document.getElementById("editModalTitle").textContent = "تعديل الكورس";

  editModal.style.display = "flex";
}

function CloseEditModal() {
  editModal.style.display = "none";
}

function OpenDeleteModal(id) {
  if (!isStaff()) {
    showToast("ليس لديك صلاحية لتنفيذ هذا الإجراء.", "warning");
    return;
  }
  deleteCourseId = id;
  deleteModal.style.display = "flex";
}

function CloseDeleteModal() {
  deleteModal.style.display = "none";
}

function setSaving(isSaving) {
  const btn = document.getElementById("saveEditBtn");
  const spinner = document.getElementById("saveEditSpinner");
  const text = document.getElementById("saveEditBtnText");

  btn.disabled = isSaving;
  spinner.hidden = !isSaving;

  text.textContent = isSaving ? "جارٍ الحفظ..." : "حفظ";
}
// ===============================
// حفظ كورس
// ===============================

async function SaveCourse() {
  if (!isStaff()) {
    showToast("ليس لديك صلاحية لتنفيذ هذا الإجراء.", "warning");
    return;
  }
  const title = editForm.Title.value.trim();
  const description = editForm.Description.value.trim();
  const videoLink = editForm.VideoUrl.value.trim();

  const isEditing = !!currentCourseId;

  if (!title) {
    showToast("من فضلك أدخل عنوان الكورس.", "warning");
    return;
  }

  if (!videoLink) {
    showToast("من فضلك أدخل رابط فيديو الكورس.", "warning");
    return;
  }

  try {
    new URL(videoLink);
  } catch {
    showToast("رابط الفيديو غير صالح.", "warning");
    return;
  }

  setSaving(true);

  try {
    // ==========================================
    // تعديل كورس
    // ==========================================

    if (isEditing) {
      const update = await fetch(`${API}/UpdateSharedCourse`, {
        method: "PUT",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentCourseId,
          title,
          description,
          videoLink,
        }),
      });

      if (!update.ok) throw new Error("Update Failed");

      CloseEditModal();
      await LoadCourses();
      showToast("تم تحديث بيانات الكورس بنجاح.", "success");

      return;
    }

    // ==========================================
    // إنشاء الكورس (الفيديو يُرسل كرابط)
    // ==========================================

    const response = await fetch(`${API}/AddSharedCourse`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        userId: currentUser.id,
        videoLink,
      }),
    });

    if (!response.ok) throw new Error("Create Course Failed");

    CloseEditModal();

    await LoadCourses();
    showToast("تمت إضافة الكورس المشترك بنجاح.", "success");
  } catch (err) {
    console.log(err);
    showToast("حدث خطأ أثناء حفظ الكورس، حاول مرة أخرى.", "error");
  } finally {
    setSaving(false);
  }
}
async function DeleteCourse() {
  if (!isStaff()) {
    showToast("ليس لديك صلاحية لتنفيذ هذا الإجراء.", "warning");
    return;
  }
  if (deleteCourseId == null) return;

  const btn = document.getElementById("confirmDeleteBtn");
  const spinner = document.getElementById("confirmDeleteSpinner");
  const text = document.getElementById("confirmDeleteBtnText");

  btn.disabled = true;
  spinner.hidden = false;
  text.textContent = "جارى الحذف...";

  try {
    const response = await fetch(
      `${API}/DeleteSharedCourse/${deleteCourseId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );

    if (response.status === 401 || response.status === 403) {
      showToast("ليس لديك صلاحية لتنفيذ هذا الإجراء.", "warning");
      return;
    }

    if (!response.ok) throw new Error("Delete Failed");

    CloseDeleteModal();

    deleteCourseId = null;

    await LoadCourses();
    showToast("تم حذف الكورس بنجاح.", "success");
  } catch (err) {
    console.log(err);

    showToast("حدث خطأ أثناء حذف الكورس، حاول مرة أخرى.", "error");
  } finally {
    btn.disabled = false;
    spinner.hidden = true;
    text.textContent = "حذف نهائياً";
  }
}

window.onclick = function (e) {
  if (e.target == editModal) CloseEditModal();

  if (e.target == deleteModal) CloseDeleteModal();

  if (e.target == videoModal) CloseVideoModal();
};

const themeSwitch = document.getElementById("themeSwitch");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");

  if (themeSwitch) themeSwitch.checked = true;
}

if (themeSwitch) {
  themeSwitch.addEventListener("change", function () {
    if (this.checked) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  });
}
