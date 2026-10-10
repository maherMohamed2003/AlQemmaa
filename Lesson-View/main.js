const BASE_API =
  (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ||
  "https://abdomahne.runasp.net/api";
const SERVER_ROOT =
  (window.APP_CONFIG && window.APP_CONFIG.ROOT) ||
  "https://abdomahne.runasp.net";
const LESSON_API = `${BASE_API}/Lesson`;
const LIKE_API = `${BASE_API}/Like`;
const QUESTION_API = `${BASE_API}/Question`;

const currentUser = GNav.requireLogin("../Login/login.html");

// اسم المدرس الثابت اللي بيتعرض على الفيديو (نفس الاسم في كل الصفحة)
const TEACHER_DISPLAY_NAME = "أ. عبدالرحمن علي مهني";

function isStaff() {
  return GNav.isStaff(currentUser);
}

GNav.mount("#gnavMount", "lessons");

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str == null ? "" : String(str);
  return d.innerHTML;
}

// يحوّل روابط المشاركة الشائعة (يوتيوب، فيميو) إلى رابط تضمين (Embed) صالح للـ iframe.

function toEmbedUrl(url) {
  try {
    if (!url) return "";

    const u = new URL(url);

    // YouTube
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let videoId = "";

      // https://www.youtube.com/watch?v=VIDEO_ID
      if (u.hostname.includes("youtube.com") && u.pathname === "/watch") {
        videoId = u.searchParams.get("v");
      }

      // https://youtu.be/VIDEO_ID
      else if (u.hostname.includes("youtu.be")) {
        videoId = u.pathname.split("/").filter(Boolean)[0];
      }

      // https://www.youtube.com/embed/VIDEO_ID
      else if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/embed/")) {
        videoId = u.pathname.split("/embed/")[1].split("/")[0];
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?controls=1&fs=0&rel=0&modestbranding=1`;
      }
    }

    // Vimeo
    if (u.hostname.includes("vimeo.com") && !u.hostname.includes("player")) {
      const id = u.pathname.split("/").filter(Boolean).pop();

      if (id && /^\d+$/.test(id)) {
        return `https://player.vimeo.com/video/${id}?controls=1`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

function relativeTime(iso) {
  const then = new Date(iso);
  if (isNaN(then.getTime())) return "";
  const now = new Date();
  let diff = Math.floor((now - then) / 1000);
  if (diff < 0) diff = 0;
  const labels = ["ثانية", "دقيقة", "ساعة", "يوم", "شهر", "سنة"];
  const steps = [60, 60, 24, 30, 12];
  if (diff < 60) return "منذ لحظات";
  let value = diff;
  let idx = 0;
  for (let i = 0; i < steps.length; i++) {
    if (value < steps[i]) break;
    value = Math.floor(value / steps[i]);
    idx++;
  }
  return `منذ ${value} ${labels[idx]}`;
}

// ---------- likes modal ----------
const likesModalOverlay = document.getElementById("likesModalOverlay");
const likesModalList = document.getElementById("likesModalList");
const likesModalClose = document.getElementById("likesModalClose");

function openLikesModal(likes) {
  likesModalList.innerHTML =
    !likes || likes.length === 0
      ? `<div class="likes-empty">لا توجد إعجابات بعد</div>`
      : likes
          .map(
            (l) => `
        <div class="likes-row">
          <span class="likes-name">${escapeHtml(l.studentName || "طالب")}</span>
          <span class="likes-time">${relativeTime(l.createdAt)}</span>
        </div>`,
          )
          .join("");
  likesModalOverlay.classList.add("open");
}
function closeLikesModal() {
  likesModalOverlay.classList.remove("open");
}
likesModalClose.addEventListener("click", closeLikesModal);
likesModalOverlay.addEventListener("click", (e) => {
  if (e.target === likesModalOverlay) closeLikesModal();
});

let lessonId = null;
let likes = [];
let alreadyLiked = false;
let questions = [];
let lessonPlayer = null; // كائن مشغّل يوتيوب (لو الفيديو من يوتيوب)

// جدول أسماء مستويات الجودة اللي يوتيوب بيرجعها بالإنجليزي التقني
const QUALITY_LABELS = {
  hd2160: "4K",
  hd1440: "1440p",
  hd1080: "1080p",
  hd720: "720p",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
  auto: "تلقائي",
};
// قائمة افتراضية نستخدمها لو يوتيوب رجع قائمة فاضية (بيحصل أحيانًا قبل ما التشغيل يبدأ فعليًا)
const DEFAULT_QUALITY_LEVELS = ["hd1080", "hd720", "large", "medium", "small", "auto"];

window.onload = async function () {
  lessonId = localStorage.getItem("lessonId");
  const api = `${LESSON_API}/GetLessonById/?Id=${lessonId}`;
  const res = await fetch(api);
  if (res == null) console.log("Can Not Found");
  const ele = await res.json();
  const html = document.getElementById("cont");

  html.innerHTML = `
    
    <div class="player-wrap" id="playerWrap">
      <iframe
        id="lessonVideo"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
      <div class="video-watermark" id="videoWatermark"></div>
      <div class="video-watermark-float" id="videoWatermarkFloat"></div>
    </div>

    <div class="lesson-info">
      <h1 class="lesson-title">${escapeHtml(ele.title)}</h1>
      <div class="lesson-meta">
        <div class="teacher-chip">
          <span class="teacher-dot">ع</span>
          <div>
            <div class="teacher-name">الأستاذ عبدالرحمن علي مهني</div>
            <div class="teacher-role">معلّم اللغة العربية</div>
          </div>
        </div>
      </div>
      <p class="lesson-desc">${escapeHtml(ele.description)}</p>

      <input type="checkbox" id="likeSwitch">
      <div class="actions-row">
        <label class="action-btn like-btn" for="likeSwitch" id="likeBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          <span class="like-label-off">أعجبني</span>
          <span class="like-label-on">أعجبني ✓</span>
        </label>
        <button type="button" class="like-count-btn" id="likeCountBtn" disabled></button>
        <label class="action-btn ask-btn" for="askSwitch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4"/><path d="M12 17h.01"/></svg>
          اسأل سؤالاً
        </label>
      </div>

      <!-- checkbox فتح/غلق مربع السؤال — CSS فقط -->
      <input type="checkbox" id="askSwitch">
      <form class="ask-box" id="askForm">
        <input type="text" name="question" id="askInput" placeholder="اكتب سؤالك للمعلم هنا...">
        <button type="submit" class="ask-send" id="askSend">إرسال</button>
      </form>
    </div>

    <div class="qa-section">
      <div class="qa-head">
        <h2 class="qa-title">الأسئلة</h2>
        <span class="qa-count" id="qaCount">0</span>
      </div>

      <div class="qa-list" id="qaList"></div>
      <div class="qa-empty" id="qaEmpty" style="display:none;">لا توجد أسئلة بعد، كن أول من يسأل المعلم عن هذا الدرس.</div>
    </div>

    `;

  wireLikes();
  wireQuestions();
  loadLikes();
  loadQuestions();
  wireVideoProtection();
  ensureVideoOverlayBar();
  ensureVideoTopBar();
  loadVideo(ele.videoLink);
};

// بيحمّل الفيديو جوه الـ iframe: لو الرابط من يوتيوب بنستخدم مشغّل يوتيوب الحقيقي
// (YT.Player) عشان نقدر نتحكم في الجودة برمجيًا، وغير كده (فيميو مثلًا) بنستخدم iframe عادي.
function loadVideo(videoLink) {
    const iframe = document.getElementById("lessonVideo");

    if (!iframe) {
        console.log("iframe not found");
        return;
    }

    console.log("videoLink from API:", videoLink);

    let videoId = "";

    try {
        const url = new URL(videoLink);

        if (url.hostname.includes("youtube.com")) {
            if (url.pathname === "/watch") {
                videoId = url.searchParams.get("v");
            }
            else if (url.pathname.startsWith("/embed/")) {
                videoId = url.pathname.split("/embed/")[1].split("/")[0];
            }
        }
        else if (url.hostname.includes("youtu.be")) {
            videoId = url.pathname.split("/").filter(Boolean)[0];
        }
    } catch (e) {
        console.error("Invalid video URL:", e);
    }

    console.log("YouTube ID:", videoId);

    if (!videoId) {
        console.error("Could not extract YouTube ID");
        return;
    }

    // fs=0 عشان زرار التكبير الأصلي بتاع يوتيوب متقفل (عندنا زرار تكبير مخصّص)،
    // rel=0 و modestbranding=1 بيقللوا عناصر يوتيوب الظاهرة، playsinline=1 للموبايل
    const embedUrl =
        `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&fs=0&iv_load_policy=3&playsinline=1`;

    console.log("FINAL IFRAME SRC:", embedUrl);

    iframe.src = embedUrl;
}
function wireLikes() {
  const likeSwitch = document.getElementById("likeSwitch");
  const likeCountBtn = document.getElementById("likeCountBtn");

  likeCountBtn.addEventListener("click", () => {
    if (likes.length) openLikesModal(likes);
  });

  // نفس الزرار بيعمل لايك أو إلغاء لايك — السيرفر هو اللي بيقرر لأن AddNewLikeToLesson
  // بقى Toggle: لو اليوزر عامل لايك قبل كده بيتشال، غير كده بيتضاف.
  likeSwitch.addEventListener("change", async () => {
    likeSwitch.disabled = true;
    try {
      const res = await fetch(`${LIKE_API}/AddNewLikeToLesson`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ThingId: Number(lessonId),
          UserId: currentUser.id,
        }),
      });
      if (res.ok) {
        await loadLikes();
      } else {
        likeSwitch.checked = alreadyLiked; // رجّع الحالة القديمة لو فشل الطلب
      }
    } catch (err) {
      console.log(err);
      likeSwitch.checked = alreadyLiked;
    } finally {
      likeSwitch.disabled = false;
    }
  });
}

// بيتأكد لو اللايك ده بتاع اليوزر الحالي — بيجرب أكتر من اسم للحقل عشان يتوافق مع أي شكل يرجعه الباك إند
function isMyLike(l) {
  const uid = l.userId ?? l.UserId ?? l.studentId ?? l.StudentId ?? l.userID;
  return uid != null && String(uid) === String(currentUser.id);
}

async function loadLikes() {
  try {
    const res = await fetch(`${LIKE_API}/GetAllLikesPerLesson/${lessonId}`);
    likes = res.ok ? await res.json() : [];
  } catch (err) {
    likes = [];
  }
  alreadyLiked = likes.some(isMyLike);
  const likeCountBtn = document.getElementById("likeCountBtn");
  likeCountBtn.textContent = likes.length > 0 ? likes.length : "";
  likeCountBtn.disabled = likes.length === 0;
  document.getElementById("likeSwitch").checked = alreadyLiked;
}

function renderQuestionItem(q) {
  return `
    <div class="qa-item" data-question-id="${q.id}" style="animation-delay:.05s">
      <div class="qa-avatar">${escapeHtml((q.studentName || "ط")[0])}</div>
      <div class="qa-bubble">
        <div>
          <div class="qa-who">
            <span class="qa-name">${escapeHtml(q.studentName || "طالب")}</span>
            <span class="qa-time">${relativeTime(q.createdAt)}</span>
          </div>
          <p class="qa-text">${escapeHtml(q.content || "")}</p>
        </div>
        <button type="button" class="qa-del" data-id="${q.id}" aria-label="حذف السؤال">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
        </button>
      </div>
    </div>`;
}

function renderQuestions() {
  const qaList = document.getElementById("qaList");
  const qaEmpty = document.getElementById("qaEmpty");
  const qaCount = document.getElementById("qaCount");
  qaCount.textContent = questions.length;

  if (questions.length === 0) {
    qaList.innerHTML = "";
    qaEmpty.style.display = "block";
    return;
  }
  qaEmpty.style.display = "none";
  qaList.innerHTML = questions.map(renderQuestionItem).join("");
  qaList.querySelectorAll(".qa-del").forEach((btn) => {
    btn.addEventListener("click", () => deleteQuestion(btn.dataset.id));
  });
}

async function loadQuestions() {
  try {
    const res = await fetch(
      `${QUESTION_API}/GetAllQuestionsPerLesson/${lessonId}`,
    );
    questions = res.ok ? await res.json() : [];
  } catch (err) {
    questions = [];
  }
  renderQuestions();
}

async function deleteQuestion(id) {
  try {
    await fetch(`${QUESTION_API}/DeleteQuestion/${id}`, { method: "DELETE" });
  } catch (err) {
    console.log(err);
  }
  await loadQuestions();
}

function wireQuestions() {
  const askForm = document.getElementById("askForm");
  const askInput = document.getElementById("askInput");
  const askSend = document.getElementById("askSend");
  const askSwitch = document.getElementById("askSwitch");

  askForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const val = askInput.value.trim();
    if (!val) {
      askInput.focus();
      return;
    }
    askSend.disabled = true;
    try {
      const res = await fetch(`${QUESTION_API}/AddQuestionToLesson`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Content: val,
          LessonId: Number(lessonId),
          UserId: currentUser.id,
        }),
      });
      if (res.ok) {
        askInput.value = "";
        askSwitch.checked = false;
        await loadQuestions();
      }
    } catch (err) {
      console.log(err);
    } finally {
      askSend.disabled = false;
    }
  });
}

// ---------- حماية الفيديو (أفضل ما يمكن عمله من واجهة الموقع فقط) ----------
// ملحوظة مهمة: لا يوجد أي طريقة من الفرونت إند تمنع تسجيل الشاشة أو النسخ
// بشكل مضمون 100%، لأن المتصفح والنظام هما اللي بيتحكموا في ده. اللي بنعمله
// هنا هو أقوى رادع ممكن: منع التنزيل المباشر، منع القائمة اليمنى، منع
// الاختصارات الشائعة للحفظ/أدوات المطورين، ووضع علامة مائية باسم المدرس.
function wireVideoProtection() {
  const wrap = document.getElementById("playerWrap");
  const watermark = document.getElementById("videoWatermark");
  const watermarkFloat = document.getElementById("videoWatermarkFloat");

  if (!wrap) return;

  // علامة مائية باسم المدرس (ثابتة) — نفس الفكرة المستخدمة في صفحة الكورسات المشتركة
  const wmText = TEACHER_DISPLAY_NAME;
  if (watermark) watermark.textContent = wmText;
  if (watermarkFloat) watermarkFloat.textContent = wmText;

  // منع القائمة اليمنى
  wrap.addEventListener("contextmenu", (e) => e.preventDefault());

  // منع اختصارات لوحة المفاتيح الشائعة للحفظ أو أدوات المطورين
  document.addEventListener("keydown", (e) => {
    const key = (e.key || "").toLowerCase();
    const blockCombo =
      (e.ctrlKey || e.metaKey) && ["s", "u", "p"].includes(key);
    const blockDevTools =
      key === "f12" ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key));
    if (blockCombo || blockDevTools) {
      e.preventDefault();
    }
  });
}

// ===============================
// شريط تغطية أسفل الفيديو - بيغطي شريط تحكم يوتيوب بالكامل (100% من العرض)
// وبدل منه بنوفر زرار جودة وزرار تكبير مخصصين فوقه مباشرة.
// ===============================
function ensureVideoOverlayBar() {
  const wrapper = document.getElementById("playerWrap");
  if (!wrapper) return;

  let bar = document.getElementById("lessonVideoHideBar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "lessonVideoHideBar";
    bar.className = "video-hide-bar-bottom";
    wrapper.appendChild(bar);
  }

  bar.style.display = "block";

  // الضغط على الشريط بيعمل تحديث للصفحة (الفيديو مش هيتقفل، بس هيرجّع الصفحة زي ما فتحتها)
  bar.onclick = () => {
    window.location.reload();
  };

  ensureFullscreenButton(wrapper);
}

// ===============================
// شريط تغطية أعلى الفيديو - بيغطي شريط يوتيوب العلوي بالكامل (100% من العرض)
// وبيعرض بدل منه اسم المدرس ثابت
// ===============================
function ensureVideoTopBar() {
  const wrapper = document.getElementById("playerWrap");
  if (!wrapper) return;

  let topBar = document.getElementById("lessonVideoTopBar");
  if (!topBar) {
    topBar = document.createElement("div");
    topBar.id = "lessonVideoTopBar";
    topBar.className = "video-top-hide-bar";
    wrapper.appendChild(topBar);

    const teacherEl = document.createElement("span");
    teacherEl.id = "lessonVideoTopBarTeacher";
    teacherEl.className = "video-top-hide-bar-teacher";
    teacherEl.textContent = TEACHER_DISPLAY_NAME;

    topBar.appendChild(teacherEl);
  }

  topBar.style.display = "flex";
}

// ===============================
// زرار تكبير الفيديو (بديل مخصّص لزرار اليوتيوب الأصلي اللي اتقفل بـ fs=0)
// بيستخدم Fullscreen API على الـ wrapper نفسه من برّه، مش على الـ iframe مباشرة
// ===============================
function ensureFullscreenButton(wrapper) {
  let btn = document.getElementById("lessonVideoFullscreenBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "lessonVideoFullscreenBtn";
    btn.type = "button";
    btn.className = "video-fullscreen-btn";
    btn.title = "تكبير الفيديو";
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/></svg>';

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      ToggleVideoFullscreen();
    });

    wrapper.appendChild(btn);
  }
}

function ToggleVideoFullscreen() {
  const wrapper = document.getElementById("playerWrap");
  if (!wrapper) return;

  const isFullscreen =
    document.fullscreenElement || document.webkitFullscreenElement;

  if (!isFullscreen) {
    if (wrapper.requestFullscreen) wrapper.requestFullscreen();
    else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}

// ===============================
// زرار التحكم في الجودة (بديل مخصّص لأن شريط تحكم يوتيوب بقى مغطّى بالكامل)
// بيستخدم YouTube IFrame Player API عشان يقرأ مستويات الجودة المتاحة للفيديو
// ده، ويغيّرها فعليًا عن طريق setPlaybackQuality.
// ملحوظة: يوتيوب نفسه أحيانًا بيتجاهل الجودة المختارة يدويًا ويرجع لـ"تلقائي"
// حسب سرعة الإنترنت، وده سلوك من يوتيوب مش حاجة تقدر تتحكم فيها من برّه.
// ===============================
let lessonQualityOutsideClickWired = false;

function ensureQualityControl(player) {
  const wrapper = document.getElementById("playerWrap");
  if (!wrapper || !player) return;

  let btn = document.getElementById("lessonVideoQualityBtn");
  let menu = document.getElementById("lessonVideoQualityMenu");

  if (!btn) {
    btn = document.createElement("button");
    btn.id = "lessonVideoQualityBtn";
    btn.type = "button";
    btn.className = "video-quality-btn";
    btn.title = "جودة الفيديو";
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
    wrapper.appendChild(btn);
  }

  if (!menu) {
    menu = document.createElement("div");
    menu.id = "lessonVideoQualityMenu";
    menu.className = "video-quality-menu";
    wrapper.appendChild(menu);
  }

  function renderMenu() {
    let levels = [];
    try {
      levels = player.getAvailableQualityLevels
        ? player.getAvailableQualityLevels()
        : [];
    } catch {
      levels = [];
    }
    if (!levels || levels.length === 0) levels = DEFAULT_QUALITY_LEVELS;
    if (!levels.includes("auto")) levels = [...levels, "auto"];

    let current = "auto";
    try {
      current = player.getPlaybackQuality ? player.getPlaybackQuality() : "auto";
    } catch {
      current = "auto";
    }

    menu.innerHTML = levels
      .map(
        (lvl) =>
          `<button type="button" data-level="${lvl}" class="${lvl === current ? "active" : ""}">${QUALITY_LABELS[lvl] || lvl}</button>`,
      )
      .join("");

    menu.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        try {
          player.setPlaybackQuality(b.dataset.level);
        } catch (err) {
          console.log(err);
        }
        menu.classList.remove("open");
        renderMenu();
      });
    });
  }

  btn.onclick = (e) => {
    e.stopPropagation();
    renderMenu();
    menu.classList.toggle("open");
  };

  if (!lessonQualityOutsideClickWired) {
    lessonQualityOutsideClickWired = true;
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.classList.remove("open");
      }
    });
  }
}
