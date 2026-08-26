const API = `${(window.APP_CONFIG && window.APP_CONFIG.API_BASE) || "https://abdomahne.runasp.net/api"}/User`;

const tableBody = document.getElementById("usersTable");
const loading = document.getElementById("loading");
const tableContainer = document.getElementById("tableContainer");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const yearFilter = document.getElementById("yearFilter");
const refreshBtn = document.getElementById("refreshBtn");

let users = [];
let filteredUsers = [];

const MONTH_LABELS = {
  1: "الشهر الأول",
  2: "الشهر الثاني",
  3: "الشهر الثالث",
  4: "الشهر الرابع",
  5: "الشهر الخامس",
  6: "الشهر السادس",
  7: "الشهر السابع",
  8: "الشهر الثامن",
  9: "الشهر التاسع",
  10: "الشهر العاشر",
  11: "الشهر الحادي عشر",
  12: "الشهر الثاني عشر",
};

let subsUser = null; // اليوزر اللي مودال الاشتراكات فاتح ليه دلوقتي
const subsModal = document.getElementById("subsModal");

const currentUser = GNav.requireStaff("../Home/home.html");
if (currentUser) GNav.mount("#gnavMount", "dashboard");

const authHeaders = currentUser
  ? {
      Authorization: `Bearer ${currentUser.token}`,
      "Content-Type": "application/json",
    }
  : {};

async function loadUsers() {
  loading.classList.remove("hidden");
  tableContainer.classList.add("hidden");
  emptyState.classList.add("hidden");

  try {
    const response = await fetch(`${API}/GetAllUsers`, {
      headers: authHeaders,
    });

    if (!response.ok) throw new Error("Failed");

    users = await response.json();

    filteredUsers = [...users];

    renderTable();
  } catch (err) {
    console.error(err);

    emptyState.classList.remove("hidden");
  } finally {
    loading.classList.add("hidden");
  }
}

function renderTable() {
  tableBody.innerHTML = "";

  if (filteredUsers.length === 0) {
    tableContainer.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  tableContainer.classList.remove("hidden");
  emptyState.classList.add("hidden");

  filteredUsers.forEach((user, index) => {
    const clone = document
      .getElementById("userRowTemplate")
      .content.cloneNode(true);

    clone.querySelector(".index").textContent = index + 1;

    clone.querySelector(".name").textContent = user.name;

    clone.querySelector(".phone").textContent = user.phone;

    clone.querySelector(".email").textContent = user.email;

    clone.querySelector(".role").textContent = user.roleName;

    clone.querySelector(".year").textContent =
      user.year == 1
        ? "الأولى اعدادي"
        : user.year == 2
          ? "الثانية اعدادي"
          : user.year == 3
            ? "الثالثة اعدادي"
            : user.year == 4
              ? "أولي ثانوي"
              : user.year == 5
                ? "الثانيه ثانوي"
                : user.year == 6
                  ? "الثالثة ثانوي"
                  : "-";

    const blockCheck = clone.querySelector(".block-checkbox");

    blockCheck.checked = user.isBlocked;

    blockCheck.addEventListener("change", async () => {
      blockCheck.disabled = true;

      try {
        const url = user.isBlocked
          ? `${API}/UnBlock/${user.id}`
          : `${API}/Block/${user.id}`;

        const response = await fetch(url, {
          method: "POST",
          headers: authHeaders,
        });

        if (!response.ok) console.log(response);

        user.isBlocked = !user.isBlocked;
      } catch {
        blockCheck.checked = user.isBlocked;

        alert("حدث خطأ.");
      } finally {
        blockCheck.disabled = false;
      }
    });

    clone.querySelector(".login-checkbox").checked = user.isLogin;

    clone.querySelector(".subs-btn").addEventListener("click", () => {
      openSubsModal(user);
    });

    clone.querySelector(".edit-btn").addEventListener("click", () => {
      window.location.href = `edit-user.html?id=${user.id}`;
    });

    clone.querySelector(".delete-btn").addEventListener("click", async () => {
      if (!confirm(`هل تريد حذف ${user.name}؟`)) return;

      try {
        const res = await fetch(
          `${API}/DeleteUser/${user.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!res.ok) throw new Error("Delete Failed");

        // احذف المستخدم من المصفوفة
        users = users.filter((x) => x.id !== user.id);

        // أعد تطبيق الفلاتر وإعادة الرسم
        applyFilters();

        alert("تم حذف المستخدم بنجاح");
      } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء الحذف");
      }
    });

    tableBody.appendChild(clone);
  });
}

function applyFilters() {
  const search = searchInput.value.trim().toLowerCase();

  const year = yearFilter.value;

  filteredUsers = users.filter((user) => {
    const matchYear = year === "all" || user.year == year;

    const matchSearch =
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.phone.includes(search);

    return matchYear && matchSearch;
  });

  renderTable();
}

searchInput.addEventListener("input", applyFilters);

yearFilter.addEventListener("change", applyFilters);

refreshBtn.addEventListener("click", loadUsers);

loadUsers();

// ===============================
// مودال الاشتراكات (دفع/حذف شهور)
// ===============================

function openSubsModal(user) {
  subsUser = user;
  if (!Array.isArray(subsUser.paidMonths)) subsUser.paidMonths = [];

  document.getElementById("subsUserName").textContent = `— ${user.name}`;

  renderSubsList();
  populateMonthSelect();

  subsModal.classList.add("open");
}

function closeSubsModal() {
  subsModal.classList.remove("open");
  subsUser = null;
}

function renderSubsList() {
  const list = document.getElementById("subsList");
  const months = (subsUser.paidMonths || []).slice().sort((a, b) => a - b);

  if (months.length === 0) {
    list.innerHTML = `<div class="subs-empty">لا يوجد أي شهر مدفوع لهذا المستخدم حتى الآن.</div>`;
    return;
  }

  list.innerHTML = months
    .map(
      (m) => `
      <div class="subs-item" data-month="${m}">
        <span class="subs-item-label"><i class="fa-solid fa-circle-check"></i> ${
          MONTH_LABELS[m] || `الشهر ${m}`
        }</span>
        <button type="button" class="subs-remove-btn" title="حذف الاشتراك" onclick="removeSubscriptionMonth(${m})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`,
    )
    .join("");
}

function populateMonthSelect() {
  const select = document.getElementById("subsMonthSelect");
  const paid = subsUser.paidMonths || [];

  const available = Object.keys(MONTH_LABELS)
    .map(Number)
    .filter((m) => !paid.includes(m));

  if (available.length === 0) {
    select.innerHTML = `<option value="">كل الشهور مدفوعة بالفعل</option>`;
    select.disabled = true;
    document.getElementById("subsAddBtn").disabled = true;
    return;
  }

  select.disabled = false;
  document.getElementById("subsAddBtn").disabled = false;
  select.innerHTML = available
    .map((m) => `<option value="${m}">${MONTH_LABELS[m]}</option>`)
    .join("");
}

async function addSubscriptionMonth() {
  if (!subsUser) return;

  const select = document.getElementById("subsMonthSelect");
  const month = parseInt(select.value);
  if (!month) return;

  const btn = document.getElementById("subsAddBtn");
  const spinner = document.getElementById("subsAddSpinner");
  const text = document.getElementById("subsAddBtnText");

  btn.disabled = true;
  spinner.hidden = false;
  text.style.display = "none";

  try {
    const response = await fetch(`${API}/BuyMonth`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ userId: subsUser.id, month }),
    });

    if (!response.ok) throw new Error("Buy Month Failed");

    subsUser.paidMonths = subsUser.paidMonths || [];
    subsUser.paidMonths.push(month);

    renderSubsList();
    populateMonthSelect();
  } catch (err) {
    console.error(err);
    alert("حدث خطأ أثناء إضافة الاشتراك");
  } finally {
    btn.disabled = false;
    spinner.hidden = true;
    text.style.display = "";
  }
}

async function removeSubscriptionMonth(month) {
  if (!subsUser) return;
  if (!confirm(`هل تريد حذف اشتراك ${MONTH_LABELS[month] || "الشهر " + month}؟`))
    return;

  const item = document.querySelector(`.subs-item[data-month="${month}"]`);
  const removeBtn = item ? item.querySelector(".subs-remove-btn") : null;
  if (removeBtn) removeBtn.disabled = true;

  try {
    const response = await fetch(
      `${API}/RemoveMonth/${subsUser.id}/${month}`,
      {
        method: "DELETE",
        headers: authHeaders,
      },
    );

    if (!response.ok) throw new Error("Remove Month Failed");

    subsUser.paidMonths = (subsUser.paidMonths || []).filter(
      (m) => m !== month,
    );

    renderSubsList();
    populateMonthSelect();
  } catch (err) {
    console.error(err);
    alert("حدث خطأ أثناء حذف الاشتراك");
    if (removeBtn) removeBtn.disabled = false;
  }
}

window.addEventListener("click", (e) => {
  if (e.target === subsModal) closeSubsModal();
});
