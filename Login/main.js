 // ---------- theme ----------
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  themeToggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
  });

  // ---------- password visibility ----------
  const pwInput = document.getElementById('password');
  const togglePw = document.getElementById('togglePw');
  const eyeIcon = document.getElementById('eyeIcon');
  togglePw.addEventListener('click', () => {
    const showing = pwInput.type === 'text';
    pwInput.type = showing ? 'password' : 'text';
    eyeIcon.innerHTML = showing
      ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
      : '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.68 3.9M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/>';
    togglePw.setAttribute('aria-label', showing ? 'إظهار كلمة المرور' : 'إخفاء كلمة المرور');
  });

  // ---------- form submit ----------
  const API_URL = `${(window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'https://abdomahne.runasp.net/api'}/User/Login`;
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const emailField = document.getElementById('emailField');
  const emailError = document.getElementById('emailError');
  const passwordField = document.getElementById('passwordField');
  const passwordError = document.getElementById('passwordError');
  const submitBtn = document.getElementById('submitBtn');
  const spinner = document.getElementById('spinner');
  const btnText = submitBtn.querySelector('.btn-text');
  const formMessage = document.getElementById('formMessage');

  function setMessage(kind, text){
    formMessage.textContent = text;
    formMessage.className = 'form-message show ' + kind;
  }
  function clearMessage(){
    formMessage.className = 'form-message';
    formMessage.textContent = '';
  }
  function setLoading(isLoading){
    submitBtn.disabled = isLoading;
    spinner.hidden = !isLoading;
    btnText.textContent = isLoading ? 'جارِ تسجيل الدخول...' : 'تسجيل الدخول';
  }

  function validate(){
    let ok = true;
    emailField.classList.remove('invalid');
    passwordField.classList.remove('invalid');
    emailError.textContent = '';
    passwordError.textContent = '';

    const emailVal = emailInput.value.trim();
    const pwVal = pwInput.value;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailVal || !emailPattern.test(emailVal)){
      emailField.classList.add('invalid');
      emailError.textContent = 'من فضلك أدخل بريدًا إلكترونيًا صحيحًا';
      ok = false;
    }
    if(!pwVal || pwVal.length < 4){
      passwordField.classList.add('invalid');
      passwordError.textContent = 'كلمة المرور قصيرة جدًا';
      ok = false;
    }
    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();
    if(!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Email: emailInput.value.trim(),
          Password: pwInput.value
        })
      });

      let data = null;
      try { data = await res.json(); } catch(_) {}

      if(res.ok){
        if (data) {
          localStorage.setItem('currentUser', JSON.stringify({
            id: data.id,
            name: data.name,
            year: data.year,
            phone: data.phone,
            email: data.email,
            roleName: data.roleName,
            token: data.token,
          }));
        }
        setMessage('success', 'تم تسجيل الدخول بنجاح، جارِ تحويلك...');
        setTimeout(() => {
          window.location.href = '../Home/home.html';
        }, 1200);
      } else {
        const msg = (data && (data.message || data.title || data.error)) || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        setMessage('error', msg);
      }
    } catch(err){
      setMessage('error', 'تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  });

// ================= زرار وبوكس "تواصل معنا" =================
(function () {
  var fab = document.getElementById("contactFab");
  var overlay = document.getElementById("contactModalOverlay");
  var closeBtn = document.getElementById("contactModalClose");
  var copyBtn = document.getElementById("walletCopyBtn");
  var walletNumberEl = document.getElementById("walletNumber");

  if (!fab || !overlay) return;

  function openContactModal() {
    overlay.classList.add("open");
  }
  function closeContactModal() {
    overlay.classList.remove("open");
  }

  fab.addEventListener("click", openContactModal);
  if (closeBtn) closeBtn.addEventListener("click", closeContactModal);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeContactModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeContactModal();
  });

  if (copyBtn && walletNumberEl) {
    copyBtn.addEventListener("click", function () {
      var number = walletNumberEl.textContent.trim();
      var done = function () {
        copyBtn.classList.add("copied");
        setTimeout(function () {
          copyBtn.classList.remove("copied");
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(number).then(done).catch(function () {});
      } else {
        var temp = document.createElement("textarea");
        temp.value = number;
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        try {
          document.execCommand("copy");
          done();
        } catch (err) {}
        document.body.removeChild(temp);
      }
    });
  }
})();
