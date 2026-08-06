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
