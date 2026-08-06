const BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || "https://abdomahne.runasp.net/api";
const USER_API = `${BASE}/User`;
const LESSON_API = `${BASE}/Lesson`;
const POST_API = `${BASE}/Post`;
const LIKE_API = `${BASE}/Like`;
const QUESTION_API = `${BASE}/Question`;

const YEAR_LABELS = {
  1: "الأول إعدادي",
  2: "الثاني إعدادي",
  3: "الثالث إعدادي",
  4: "الأول ثانوي",
  5: "الثاني ثانوي",
  6: "الثالث ثانوي",
};
const STAFF_LABELS = ["معلم", "مبرمج"];

const currentUser = GNav.requireStaff("../Home/home.html");
if (currentUser) GNav.mount("#gnavMount", "dashboard");

function authHeaders() {
  return currentUser && currentUser.token
    ? { Authorization: `Bearer ${currentUser.token}` }
    : {};
}

async function safeJson(url) {
  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.log(err);
    return [];
  }
}

function renderBars(container, entries, maxColor) {
  const total = Math.max(...entries.map((e) => e.count), 1);
  container.innerHTML = entries
    .map(
      (e) => `
      <div class="bar-row">
        <span class="bar-label">${e.label}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${(e.count / total) * 100}%"></span></span>
        <span class="bar-count">${e.count}</span>
      </div>`,
    )
    .join("");
}

async function loadDashboard() {
  let hadError = false;

  // ---------- المستخدمين ----------
  const users = await safeJson(`${USER_API}/GetAllUsers`);
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const blockedCount = Array.isArray(users)
    ? users.filter((u) => u.isBlocked).length
    : 0;

  const roleCounts = {};
  const studentYearCounts = {};
  if (Array.isArray(users)) {
    users.forEach((u) => {
      const role = u.roleName || "غير محدد";
      roleCounts[role] = (roleCounts[role] || 0) + 1;
      if (role === "طالب" || (!STAFF_LABELS.includes(role) && u.year)) {
        studentYearCounts[u.year] = (studentYearCounts[u.year] || 0) + 1;
      }
    });
  }

  // ---------- الدروس ----------
  const lessonGroups = await safeJson(`${LESSON_API}/GetAllLessonsGroupedByYear`);
  const allLessons = Array.isArray(lessonGroups)
    ? lessonGroups.flatMap((g) => g.lessons || [])
    : [];
  const totalLessons = allLessons.length;
  const lessonsByYear = Array.isArray(lessonGroups)
    ? lessonGroups
        .filter((g) => g.lessons && g.lessons.length)
        .map((g) => ({
          label: YEAR_LABELS[g.year] || `سنة ${g.year}`,
          count: g.lessons.length,
        }))
    : [];

  // ---------- البوستات ----------
  const posts = await safeJson(`${POST_API}/GetALlPosts`);
  const totalPosts = Array.isArray(posts) ? posts.length : 0;

  // ---------- الإعجابات والأسئلة (مجموع على كل الدروس والبوستات) ----------
  let totalLikes = 0;
  let totalQuestions = 0;
  try {
    const likeCalls = [
      ...allLessons.map((l) =>
        safeJson(`${LIKE_API}/GetAllLikesPerLesson/${l.id}`),
      ),
      ...posts.map((p) => safeJson(`${LIKE_API}/GetAllLikesPerPost/${p.id}`)),
    ];
    const questionCalls = [
      ...allLessons.map((l) =>
        safeJson(`${QUESTION_API}/GetAllQuestionsPerLesson/${l.id}`),
      ),
      ...posts.map((p) =>
        safeJson(`${QUESTION_API}/GetAllQuestionsPerPost/${p.id}`),
      ),
    ];

    const [likeResults, questionResults] = await Promise.all([
      Promise.all(likeCalls),
      Promise.all(questionCalls),
    ]);

    totalLikes = likeResults.reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0,
    );
    totalQuestions = questionResults.reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0,
    );
  } catch (err) {
    console.log(err);
    hadError = true;
  }

  // ---------- الرسم ----------
  document.getElementById("statUsers").textContent = totalUsers;
  document.getElementById("statLessons").textContent = totalLessons;
  document.getElementById("statPosts").textContent = totalPosts;
  document.getElementById("statLikes").textContent = totalLikes;
  document.getElementById("statQuestions").textContent = totalQuestions;
  document.getElementById("statBlocked").textContent = blockedCount;

  const roleEntries = Object.keys(roleCounts).map((r) => ({
    label: r,
    count: roleCounts[r],
  }));
  renderBars(document.getElementById("roleBars"), roleEntries);

  const yearEntries =
    lessonsByYear.length > 0
      ? lessonsByYear
      : [{ label: "لا توجد دروس بعد", count: 0 }];
  renderBars(document.getElementById("yearBars"), yearEntries);

  document.getElementById("loadingRow").classList.add("hidden");
  document.getElementById("dashContent").classList.remove("hidden");

  if (hadError) {
    document.getElementById("partialNote").textContent =
      "تنبيه: بعض الأرقام (الإعجابات/الأسئلة) ممكن تكون غير مكتملة بسبب خطأ أثناء التحميل.";
  }
}

loadDashboard();
