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

// ---------- auth guard ----------
const YEAR_LABELS = {
  1: "الصف الأول الإعدادي",
  2: "الصف الثاني الإعدادي",
  3: "الصف الثالث الإعدادي",
  4: "الصف الأول الثانوي",
  5: "الصف الثاني الثانوي",
  6: "الصف الثالث الثانوي",
};

const currentUser = GNav.requireLogin("../Login/login.html");

function isStaff() {
  return GNav.isStaff(currentUser);
}

GNav.mount("#gnavMount", "home");

const AVATAR =
  "data:image/webp;base64,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";

function relativeTime(iso) {
  const then = new Date(iso);
  if (isNaN(then.getTime())) return "";
  const now = new Date();
  let diff = Math.floor((now - then) / 1000);
  if (diff < 0) diff = 0;
  const units = [
    [60, "ثانية"],
    [60, "دقيقة"],
    [24, "ساعة"],
    [30, "يوم"],
    [12, "شهر"],
    [Infinity, "سنة"],
  ];
  let value = diff;
  let labels = ["ثانية", "دقيقة", "ساعة", "يوم", "شهر", "سنة"];
  let idx = 0;
  let steps = [60, 60, 24, 30, 12];
  if (value < 60) return "منذ لحظات";
  for (let i = 0; i < steps.length; i++) {
    if (value < steps[i]) break;
    value = Math.floor(value / steps[i]);
    idx++;
  }
  return `منذ ${value} ${labels[idx]}`;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// يحوّل أي رابط مكتوب كنص عادي جوه محتوى البوست إلى لينك فعلي قابل للضغط.
// بتشتغل على النص بعد ما يتعمله escapeHtml عشان تفضل آمنة (مفيش أي HTML
// حقيقي جاي من اليوزر بيتفّذ).
function linkifyText(escapedText) {
  const urlPattern = /((?:https?:\/\/|www\.)[^\s<]+)/gi;
  return escapedText.replace(urlPattern, (match) => {
    let trail = "";
    const trailMatch = match.match(/[.,!?;:)\]}»"']+$/);
    if (trailMatch) {
      trail = trailMatch[0];
      match = match.slice(0, match.length - trail.length);
    }
    if (!match) return match + trail;
    const href = /^https?:\/\//i.test(match) ? match : `https://${match}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="post-link">${match}</a>${trail}`;
  });
}

// ---------- api ----------
const BASE_API =
  (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ||
  "https://abdomahne.runasp.net/api";
const API_URL = `${BASE_API}/Post/GetALlPosts`;
const LIKE_API = `${BASE_API}/Like`;
const QUESTION_API = `${BASE_API}/Question`;
const POST_API = `${BASE_API}/Post`;
const container = document.getElementById("feedContainer");

// ---------- likes / questions modals ----------
const likesModalOverlay = document.getElementById("likesModalOverlay");
const likesModalList = document.getElementById("likesModalList");
const likesModalClose = document.getElementById("likesModalClose");
const commentsModalOverlay = document.getElementById("commentsModalOverlay");
const commentsModalList = document.getElementById("commentsModalList");
const commentsModalClose = document.getElementById("commentsModalClose");

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

function renderQuestionItem(q) {
  return `
    <div class="qa-item" data-question-id="${q.id}">
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

function openCommentsModal(questions, onDelete) {
  if (!questions || questions.length === 0) {
    commentsModalList.innerHTML = `<div class="qa-empty-modal">لا توجد أسئلة بعد</div>`;
  } else {
    commentsModalList.innerHTML = questions.map(renderQuestionItem).join("");
    commentsModalList.querySelectorAll(".qa-del").forEach((btn) => {
      btn.addEventListener("click", () => onDelete(btn.dataset.id));
    });
  }
  commentsModalOverlay.classList.add("open");
}
function closeCommentsModal() {
  commentsModalOverlay.classList.remove("open");
}
commentsModalClose.addEventListener("click", closeCommentsModal);
commentsModalOverlay.addEventListener("click", (e) => {
  if (e.target === commentsModalOverlay) closeCommentsModal();
});

function renderSkeletons(count) {
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `
        <div class="skeleton">
          <div class="sk-head">
            <div class="sk-avatar"></div>
            <div class="sk-meta">
              <div class="sk-line"></div>
              <div class="sk-line"></div>
            </div>
          </div>
          <div class="sk-line" style="width:96%"></div>
          <div class="sk-line" style="width:70%"></div>
        </div>`;
  }
  container.innerHTML = html;
}

function renderEmpty() {
  container.innerHTML = `
      <div class="empty-state">
        لا توجد تحديثات حتى الآن، تابعنا لمعرفة أي جديد أولًا بأول.
      </div>`;
}

function renderError() {
  container.innerHTML = `
      <div class="error-state">
        تعذّر تحميل التحديثات الآن، تأكد من اتصالك بالإنترنت.
        <div><button class="retry-btn" id="retryBtn">إعادة المحاولة</button></div>
      </div>`;
  document.getElementById("retryBtn").addEventListener("click", loadPosts);
}

function renderPosts(posts) {
  if (!posts || posts.length === 0) {
    renderEmpty();
    return;
  }

  const sorted = [...posts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  container.innerHTML = sorted
    .map((post, i) => {
      const displayName =
        post.userName && post.userName !== "string"
          ? post.userName
          : "الأستاذ عبدالرحمن علي مهني";
      const ownerActions = isStaff()
        ? `
        <div class="post-owner-actions">
          <button type="button" class="post-owner-btn post-edit-btn" title="تعديل البوست" aria-label="تعديل البوست">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button type="button" class="post-owner-btn danger post-delete-btn" title="حذف البوست" aria-label="حذف البوست">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
          </button>
        </div>`
        : "";
      return `
      <article class="post-card" data-post-id="${post.id}" style="animation-delay:${Math.min(i * 0.08, 0.6)}s">
        <div class="post-head">
          <img class="post-avatar" src="${AVATAR}" alt="${escapeHtml(displayName)}">
          <div class="post-who">
            <span class="post-name">${escapeHtml(displayName)}</span>
            <span class="post-time">${relativeTime(post.createdAt)}</span>
          </div>
          ${ownerActions}
        </div>
        <p class="post-content">${linkifyText(escapeHtml(post.content || ""))}</p>
        <div class="post-edit-box" hidden>
          <textarea class="post-edit-input"></textarea>
          <div class="post-edit-actions">
            <button type="button" class="btn-sm post-edit-save">
              <span class="post-spinner" hidden></span>
              <span class="post-edit-save-text">حفظ</span>
            </button>
            <button type="button" class="btn-sm post-edit-cancel">إلغاء</button>
          </div>
        </div>
        <div class="post-actions">
          <div class="like-wrap">
            <button class="action-btn like-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
              <span class="like-label">أعجبني</span>
            </button>
            <button type="button" class="like-count-btn" disabled></button>
          </div>
          <button class="action-btn ask-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4"/><path d="M12 17h.01"/></svg>
            اسأل سؤالاً
          </button>
          <button type="button" class="action-btn comments-btn" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="comments-count"></span>
          </button>
        </div>
        <div class="ask-box">
          <input type="text" placeholder="اكتب سؤالك للمعلم هنا...">
          <button class="ask-send">إرسال</button>
        </div>
        <div class="ask-sent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          تم إرسال سؤالك، هيتم الرد عليك قريبًا
        </div>
      </article>`;
    })
    .join("");

  attachCardHandlers();
}

function attachCardHandlers() {
  document.querySelectorAll(".post-card").forEach((card) => {
    const postId = card.dataset.postId;
    const likeBtn = card.querySelector(".like-btn");
    const likeLabel = likeBtn.querySelector(".like-label");
    const likeCountBtn = card.querySelector(".like-count-btn");
    const commentsBtn = card.querySelector(".comments-btn");
    const commentsCount = commentsBtn.querySelector(".comments-count");

    let likes = [];
    let questions = [];
    let alreadyLiked =
      localStorage.getItem(`liked_post_${postId}_${currentUser.id}`) === "1";

    function renderLikeState() {
      likeCountBtn.textContent = likes.length > 0 ? likes.length : "";
      likeCountBtn.disabled = likes.length === 0;
      likeBtn.classList.toggle("liked", alreadyLiked);
      likeBtn.disabled = alreadyLiked;
      likeLabel.textContent = alreadyLiked ? "أعجبني ✓" : "أعجبني";
    }

    async function loadLikes() {
      try {
        const res = await fetch(`${LIKE_API}/GetAllLikesPerPost/${postId}`);
        likes = res.ok ? await res.json() : [];
      } catch (err) {
        likes = [];
      }
      renderLikeState();
    }

    async function loadQuestions() {
      try {
        const res = await fetch(
          `${QUESTION_API}/GetAllQuestionsPerPost/${postId}`,
        );
        questions = res.ok ? await res.json() : [];
      } catch (err) {
        questions = [];
      }
      commentsCount.textContent = questions.length > 0 ? questions.length : "";
      commentsBtn.disabled = questions.length === 0;
    }

    loadLikes();
    loadQuestions();

    likeCountBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (likes.length) openLikesModal(likes);
    });

    async function handleDeleteQuestion(id) {
      try {
        await fetch(`${QUESTION_API}/DeleteQuestion/${id}`, {
          method: "DELETE",
        });
      } catch (err) {}
      await loadQuestions();
      if (questions.length) {
        openCommentsModal(questions, handleDeleteQuestion);
      } else {
        closeCommentsModal();
      }
    }

    commentsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (questions.length) {
        openCommentsModal(questions, handleDeleteQuestion);
      }
    });

    likeBtn.addEventListener("click", async () => {
      if (alreadyLiked) return;
      likeBtn.disabled = true;
      try {
        const res = await fetch(`${LIKE_API}/AddNewLikeToPost`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ThingId: Number(postId),
            UserId: currentUser.id,
          }),
        });
        if (res.ok) {
          alreadyLiked = true;
          localStorage.setItem(`liked_post_${postId}_${currentUser.id}`, "1");
          likeBtn.classList.remove("bump");
          void likeBtn.offsetWidth;
          likeBtn.classList.add("bump");
          await loadLikes();
        }
      } catch (err) {
        console.log(err);
      } finally {
        likeBtn.disabled = alreadyLiked;
      }
    });

    const askBtn = card.querySelector(".ask-btn");
    const askBox = card.querySelector(".ask-box");
    const askInput = askBox.querySelector("input");
    const askSend = askBox.querySelector(".ask-send");
    const askSent = card.querySelector(".ask-sent");

    // ---------- تعديل / حذف البوست (للمعلم والمبرمج فقط) ----------
    const editBtn = card.querySelector(".post-edit-btn");
    const deleteBtn = card.querySelector(".post-delete-btn");
    const contentEl = card.querySelector(".post-content");
    const editBox = card.querySelector(".post-edit-box");
    const editInput = editBox
      ? editBox.querySelector(".post-edit-input")
      : null;
    const editSaveBtn = editBox
      ? editBox.querySelector(".post-edit-save")
      : null;
    const editCancelBtn = editBox
      ? editBox.querySelector(".post-edit-cancel")
      : null;
    const editSpinner = editBox ? editBox.querySelector(".post-spinner") : null;
    const editSaveText = editBox
      ? editBox.querySelector(".post-edit-save-text")
      : null;

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        editInput.value = contentEl.textContent;
        contentEl.hidden = true;
        editBox.hidden = false;
        editInput.focus();
      });
    }

    if (editCancelBtn) {
      editCancelBtn.addEventListener("click", () => {
        editBox.hidden = true;
        contentEl.hidden = false;
      });
    }

    if (editSaveBtn) {
      editSaveBtn.addEventListener("click", async () => {
        const newContent = editInput.value.trim();
        if (!newContent) {
          editInput.focus();
          return;
        }
        editSaveBtn.disabled = true;
        editCancelBtn.disabled = true;
        if (editSpinner) editSpinner.hidden = false;
        if (editSaveText) editSaveText.textContent = "جارِ الحفظ...";
        try {
          const res = await fetch(`${POST_API}/EditPost`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentUser.token}`,
            },
            body: JSON.stringify({
              Id: Number(postId),
              Content: newContent,
              UserId: currentUser.id,
            }),
          });
          if (res.status === 401 || res.status === 403) {
            alert("مفيش صلاحية لتعديل البوستات");
            return;
          }
          if (!res.ok) throw new Error("Edit failed");
          contentEl.textContent = newContent;
          editBox.hidden = true;
          contentEl.hidden = false;
        } catch (err) {
          console.log(err);
          alert("حدث خطأ أثناء تعديل البوست");
        } finally {
          editSaveBtn.disabled = false;
          editCancelBtn.disabled = false;
          if (editSpinner) editSpinner.hidden = true;
          if (editSaveText) editSaveText.textContent = "حفظ";
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (
          !confirm(
            "هل أنت متأكد من حذف هذا البوست؟ لا يمكن التراجع عن هذا الإجراء.",
          )
        )
          return;
        deleteBtn.disabled = true;
        if (editBtn) editBtn.disabled = true;
        try {
          const res = await fetch(`${POST_API}/DeletePost/${postId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${currentUser.token}` },
          });
          if (res.status === 401 || res.status === 403) {
            alert("مفيش صلاحية لحذف البوستات");
            return;
          }
          if (!res.ok) throw new Error("Delete failed");
          card.remove();
        } catch (err) {
          console.log(err);
          alert("حدث خطأ أثناء حذف البوست");
        } finally {
          deleteBtn.disabled = false;
          if (editBtn) editBtn.disabled = false;
        }
      });
    }

    askBtn.addEventListener("click", () => {
      const open = askBox.classList.toggle("open");
      askBtn.classList.toggle("active", open);
      if (open) askInput.focus();
    });

    async function sendQuestion() {
      const val = askInput.value.trim();
      if (!val) {
        askInput.focus();
        return;
      }
      askSend.disabled = true;
      try {
        const res = await fetch(`${QUESTION_API}/AddQuestionToPost`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Content: val,
            LessonId: Number(postId),
            UserId: currentUser.id,
          }),
        });
        if (res.ok) {
          askInput.value = "";
          askBox.classList.remove("open");
          askBtn.classList.remove("active");
          askSent.classList.add("show");
          setTimeout(() => askSent.classList.remove("show"), 4000);
          await loadQuestions();
        }
      } catch (err) {
        console.log(err);
      } finally {
        askSend.disabled = false;
      }
    }
    askSend.addEventListener("click", sendQuestion);
    askInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendQuestion();
    });
  });
}

async function loadPosts() {
  renderSkeletons(3);
  try {
    const res = await fetch(API_URL);
    if (!res.ok) console.log("bad status");
    const data = await res.json();
    renderPosts(data);
  } catch (err) {
    renderError();
  }
}

loadPosts();
