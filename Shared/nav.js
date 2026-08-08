/* ============================================================
   Shared/nav.js
   نافبار موحّد لكل صفحات المنصة — يبني نفس روابط التنقل والخروج
   في أي صفحة تستدعيه، بدل ما كل صفحة تكرر نفس الكود.
   ============================================================ */

(function () {
  const STAFF_ROLES = ["معلم", "مبرمج"];
  const API_BASE =
    (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ||
    "https://abdomahne.runasp.net/api";
  const LOGOUT_API = `${API_BASE}/User/Logout`;
  const PING_API = `${API_BASE}/User/Ping`;
  const PING_INTERVAL_MS = 60 * 1000; // دقيقة واحدة

  const LINKS = [
    { key: "home", href: "../Home/home.html", label: "الرئيسة", staff: false },
    {
      key: "lessons",
      href: "../Lessons-List/lessons.html",
      label: "الدروس",
      staff: false,
    },
    {
      key: "sharedCourses",
      href: "../Shared-Courses/shared-courses.html",
      label: " الفيديوهات المفتوحة",
      staff: false,
    },
    {
      key: "addPost",
      href: "../Add Post/index.html",
      label: "إضافة بوست",
      staff: true,
    },
    {
      key: "dashboard",
      href: "../Dashboard/index.html",
      label: "لوحة التحكم",
      staff: true,
    },
    {
      key: "profile",
      href: "../Profile/index.html",
      label: "بروفايلي",
      staff: false,
    },
  ];

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch (err) {
      return null;
    }
  }

  function isStaff(user) {
    return !!user && STAFF_ROLES.includes(user.roleName);
  }

  function injectStyles() {
    if (document.getElementById("gnav-style")) return;
    const style = document.createElement("style");
    style.id = "gnav-style";
    style.textContent = `
      .gnav{ display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
      .gnav-link{
        display:flex; align-items:center; gap:6px;
        font-family:'Cairo', sans-serif; font-size:13px; font-weight:700;
        color:var(--ink-soft); text-decoration:none;
        padding:9px 13px; border-radius:10px; border:1px solid var(--line);
        transition:background .2s ease, color .2s ease;
        white-space:nowrap;
      }
      .gnav-link:hover{ background:var(--bg-soft); color:var(--ink); }
      .gnav-link.active{ background:var(--teal); border-color:var(--teal); color:#FBF6E8; }
      .gnav-user{
        display:flex; align-items:center; gap:8px;
        padding:6px 12px 6px 6px; border-radius:999px; border:1px solid var(--line); background:var(--bg-soft);
        font-family:'Cairo', sans-serif;
      }
      .gnav-user-avatar{
        width:28px; height:28px; border-radius:50%; flex-shrink:0;
        background:linear-gradient(135deg, var(--teal), var(--teal-deep));
        display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:12px;
      }
      .gnav-user-name{ font-size:12.5px; font-weight:700; color:var(--ink); }
      .gnav-logout{
        display:flex; align-items:center; gap:6px;
        font-family:'Cairo', sans-serif; font-size:13px; font-weight:700;
        color:var(--gnav-danger, #A23B3B); background:transparent; cursor:pointer;
        padding:9px 13px; border-radius:10px; border:1px solid var(--line);
        transition:background .2s ease;
      }
      .gnav-logout:hover{ background:rgba(162,59,59,0.12); }
      .gnav-logout svg{ width:15px; height:15px; }
      .gnav-link svg{ width:15px; height:15px; }
      @media (max-width: 780px){
        .gnav-link span.gnav-label{ display:none; }
        .gnav-user-name{ display:none; }
      }
    `;
    document.head.appendChild(style);
  }

  function iconFor(key) {
    const icons = {
      home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
      lessons: '<path d="M4 6h16M4 12h16M4 18h7"/>',
      sharedCourses:
        '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      addLesson: '<path d="M23 7l-7 5 7 5V7zM1 5h15v14H1z"/>',
      addPost: '<path d="M12 5v14M5 12h14"/>',
      dashboard:
        '<path d="M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z"/>',
      profile:
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[key] || ""}</svg>`;
  }

  async function logout(user) {
    try {
      if (user && user.id) {
        await fetch(`${LOGOUT_API}/${user.id}`, {
          method: "POST",
          headers: user.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      localStorage.removeItem("currentUser");
      window.location.href = "../Login/login.html";
    }
  }

  let pingStarted = false;

  // بيبعت "بينج" كل دقيقة لتحديث آخر ظهور (LastSeen) بتاع اليوزر في الباك إند،
  // ده اللي بيستخدمه السيرفر عشان يمنع نفس الحساب من تسجيل الدخول مرتين
  // في نفس الوقت تقريبًا من جهازين مختلفين.
  function startPresencePing(user) {
    if (pingStarted || !user || !user.id) return;
    pingStarted = true;

    const sendPing = () => {
      fetch(`${PING_API}/${user.id}`, {
        method: "POST",
        headers: user.token ? { Authorization: `Bearer ${user.token}` } : {},
      }).catch((err) => console.log(err));
    };

    sendPing(); // أول بينج فورًا لحظة تحميل الصفحة
    setInterval(sendPing, PING_INTERVAL_MS);
  }

  function mount(selector, activeKey) {
    const target =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;
    if (!target) return;

    const user = getUser();
    if (!user) {
      window.location.href = "../Login/login.html";
      return;
    }

    injectStyles();
    startPresencePing(user);

    const staff = isStaff(user);
    const visibleLinks = LINKS.filter((l) => !l.staff || staff);

    const linksHtml = visibleLinks
      .map(
        (l) => `
        <a class="gnav-link${l.key === activeKey ? " active" : ""}" href="${l.href}">
          ${iconFor(l.key)}<span class="gnav-label">${l.label}</span>
        </a>`,
      )
      .join("");

    target.innerHTML = `
      <nav class="gnav">
        ${linksHtml}
        <div class="gnav-user">
          <span class="gnav-user-avatar">${(user.name || "ط")[0]}</span>
          <span class="gnav-user-name">${user.name || ""}</span>
        </div>
        <button type="button" class="gnav-logout" id="gnavLogoutBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span class="gnav-label">خروج</span>
        </button>
      </nav>
    `;

    document.getElementById("gnavLogoutBtn").addEventListener("click", () => {
      if (confirm("هل تريد تسجيل الخروج؟")) logout(user);
    });
  }

  window.GNav = {
    getUser,
    isStaff,
    mount,
    logout,
    requireLogin(loginPath) {
      const user = getUser();
      if (!user) {
        window.location.href = loginPath || "../Login/login.html";
        return null;
      }
      return user;
    },
    requireStaff(fallbackPath) {
      const user = getUser();
      if (!user) {
        window.location.href = "../Login/login.html";
        return null;
      }
      if (!isStaff(user)) {
        alert("الصفحة دي متاحة بس للمعلم أو المبرمج");
        window.location.href = fallbackPath || "../Home/home.html";
        return null;
      }
      return user;
    },
  };
})();
