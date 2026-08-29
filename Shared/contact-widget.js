/* ============================================================
   Shared/contact-widget.js
   زرار "تواصل معنا" + البوكس الخاص بيه — موحّد لكل صفحات المنصة.
   الملف ده بيبني نفس الزرار والبوكس في أي صفحة يتضاف فيها بدل ما
   كل صفحة تكرر نفس الـ HTML/CSS/JS في ملفاتها.

   عشان تضيف/تعدّل رابط تواصل جديد، غيّر بس في مصفوفة LINKS تحت.
   ============================================================ */

(function () {
  if (window.ContactWidget) return; // امنع التكرار لو الملف اتحمّل أكتر من مرة

  const WALLET_NUMBER = "01007155608";

  const LINKS = [
    {
      key: "instapay",
      title: "الدفع عبر إنستاباي",
      sub: "InstaPay",
      href: "https://ipn.eg/S/abdomahne/instapay/3XbXq0",
      icon: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/>',
    },
    {
      key: "whatsapp",
      title: "تواصل عبر واتساب",
      sub: "WhatsApp",
      href: "https://wa.me/201007155608",
      icon: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    },
    {
      key: "wachannel",
      title: "قناة واتساب",
      sub: "WhatsApp Channel",
      href: "https://whatsapp.com/channel/0029Va25sbCDeONCSUWr730i",
      icon: '<path d="M3 11l18-7-7 18-2.5-7.5L3 11z"/>',
    },
    {
      key: "tiktok",
      title: "تابعنا على تيك توك",
      sub: "TikTok",
      href: "https://vm.tiktok.com/ZS9hhUMbbwGA7-9iAtU/",
      icon: '<path d="M16 3v9.5a3.5 3.5 0 1 1-2.5-3.36V6.6A6.1 6.1 0 1 0 18.5 12.7V9.2a5.9 5.9 0 0 0 3.5 1.13V7.3A4.1 4.1 0 0 1 18 3.2 4 4 0 0 1 16 3z"/>',
    },
    {
      key: "facebook",
      title: "صفحتنا على فيسبوك",
      sub: "Facebook",
      href: "https://www.facebook.com/Abdalrahman.mahne",
      icon: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    },
  ];

  const ICON_BG = {
    instapay: "linear-gradient(135deg,#0F6156,#0A4740)",
    whatsapp: "linear-gradient(135deg,#3fb37c,#1c6e42)",
    wachannel: "linear-gradient(135deg,#3fb37c,#1c6e42)",
    tiktok: "linear-gradient(135deg,#232323,#010101)",
    facebook: "linear-gradient(135deg,#4267B2,#2c4884)",
  };

  function injectStyles() {
    if (document.getElementById("contact-widget-style")) return;
    const style = document.createElement("style");
    style.id = "contact-widget-style";
    style.textContent = `
      .cw-fab{
        position:fixed; bottom:22px; left:22px; z-index:9998;
        display:flex; align-items:center; gap:9px;
        padding:13px 20px; border-radius:999px; border:none;
        background:linear-gradient(135deg,#0F6156,#0A4740);
        color:#FBF6E8; font-family:'Cairo', sans-serif; font-weight:700; font-size:14px;
        cursor:pointer; box-shadow:0 14px 30px -12px rgba(15,97,86,0.55);
        transition:transform .2s ease, filter .2s ease;
      }
      .cw-fab:hover{ transform:translateY(-2px); filter:brightness(1.06); }
      .cw-fab svg{ width:19px; height:19px; flex-shrink:0; }

      .cw-overlay{
        position:fixed; inset:0; z-index:9999;
        background:rgba(10,15,14,0.5);
        display:none; align-items:flex-end; justify-content:center;
        padding:16px;
      }
      .cw-overlay.open{ display:flex; }
      @media (min-height: 560px){ .cw-overlay{ align-items:center; } }

      .cw-modal{
        width:100%; max-width:400px; max-height:86vh; overflow-y:auto;
        background:#FFFDF8; border:1px solid rgba(28,42,44,0.14); border-radius:22px;
        box-shadow:0 40px 80px -30px rgba(0,0,0,0.5);
        padding:26px 24px 24px;
        opacity:0; transform:translateY(16px) scale(.98);
        animation:cwModalIn .3s cubic-bezier(.2,.8,.25,1) forwards;
      }
      @keyframes cwModalIn{ to{ opacity:1; transform:translateY(0) scale(1); } }

      .cw-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
      .cw-title{ font-family:'Aref Ruqaa', serif; font-size:23px; margin:0; color:#1C2A2C; }
      .cw-close{
        width:32px; height:32px; border-radius:9px; border:none; background:#F3E9D4;
        color:#5B6664; cursor:pointer; display:flex; align-items:center; justify-content:center;
        flex-shrink:0;
      }
      .cw-close:hover{ background:rgba(28,42,44,0.14); color:#1C2A2C; }
      .cw-close svg{ width:16px; height:16px; }

      .cw-sub{ font-size:13.5px; color:#5B6664; margin:0 0 18px; line-height:1.8; }

      .cw-links{ display:flex; flex-direction:column; gap:10px; margin-bottom:18px; }
      .cw-link{
        display:flex; align-items:center; gap:12px;
        padding:13px 14px; border-radius:14px; border:1px solid rgba(28,42,44,0.14); background:#F3E9D4;
        text-decoration:none; color:#1C2A2C;
        transition:background .2s ease, transform .15s ease;
      }
      .cw-link:hover{ background:rgba(28,42,44,0.14); transform:translateY(-1px); }
      .cw-link-icon{
        width:38px; height:38px; border-radius:11px; flex-shrink:0;
        display:flex; align-items:center; justify-content:center;
        color:#fff;
      }
      .cw-link-icon svg{ width:18px; height:18px; }
      .cw-link-text{ display:flex; flex-direction:column; gap:1px; flex:1; min-width:0; }
      .cw-link-title{ font-size:13.5px; font-weight:700; }
      .cw-link-sub{ font-size:11.5px; color:#5B6664; }
      .cw-link-arrow{ width:16px; height:16px; color:#5B6664; flex-shrink:0; transform:scaleX(-1); }

      .cw-wallet{ border-top:1px dashed rgba(28,42,44,0.14); padding-top:16px; }
      .cw-wallet-label{ font-size:12px; font-weight:700; color:#5B6664; display:block; margin-bottom:8px; }
      .cw-wallet-row{
        display:flex; align-items:center; justify-content:space-between; gap:10px;
        background:#F3E9D4; border:1px solid rgba(28,42,44,0.14); border-radius:12px; padding:11px 14px;
      }
      .cw-wallet-number{
        font-family:'Cairo', sans-serif; font-size:15px; font-weight:800; color:#1C2A2C;
        direction:ltr; letter-spacing:.5px;
      }
      .cw-wallet-copy{
        width:30px; height:30px; border-radius:9px; border:1px solid rgba(28,42,44,0.14); background:#FFFDF8;
        color:#5B6664; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;
      }
      .cw-wallet-copy:hover{ background:rgba(28,42,44,0.14); color:#1C2A2C; }
      .cw-wallet-copy.copied{ color:#1F7A54; border-color:#0F6156; }
      .cw-wallet-copy svg{ width:14px; height:14px; }

      @media (max-width: 480px){
        .cw-fab span{ display:none; }
        .cw-fab{ padding:14px; }
        .cw-modal{ padding:22px 18px 20px; border-radius:20px 20px 0 0; max-width:none; }
      }
    `;
    document.head.appendChild(style);
  }

  function linksHtml() {
    return LINKS.map(
      (l) => `
      <a class="cw-link" href="${l.href}" target="_blank" rel="noopener noreferrer">
        <span class="cw-link-icon" style="background:${ICON_BG[l.key] || "linear-gradient(135deg,#0F6156,#0A4740)"}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${l.icon}</svg>
        </span>
        <span class="cw-link-text">
          <span class="cw-link-title">${l.title}</span>
          <span class="cw-link-sub">${l.sub}</span>
        </span>
        <svg class="cw-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
      </a>`,
    ).join("");
  }

  function buildMarkup() {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <button type="button" class="cw-fab" id="cwFab" aria-haspopup="dialog" aria-controls="cwModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        <span>تواصل معنا</span>
      </button>

      <div class="cw-overlay" id="cwOverlay">
        <div class="cw-modal" id="cwModal" role="dialog" aria-modal="true" aria-labelledby="cwTitle">
          <div class="cw-head">
            <h2 class="cw-title" id="cwTitle">تواصل معنا</h2>
            <button type="button" class="cw-close" id="cwClose" aria-label="إغلاق">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <p class="cw-sub">تقدر تتواصل معانا أو تدفع بسهولة من خلال:</p>

          <div class="cw-links">${linksHtml()}</div>

          <div class="cw-wallet">
            <span class="cw-wallet-label">رقم المحفظة</span>
            <div class="cw-wallet-row">
              <span class="cw-wallet-number" id="cwWalletNumber">${WALLET_NUMBER}</span>
              <button type="button" class="cw-wallet-copy" id="cwWalletCopyBtn" aria-label="نسخ رقم المحفظة">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  function wire() {
    const fab = document.getElementById("cwFab");
    const overlay = document.getElementById("cwOverlay");
    const closeBtn = document.getElementById("cwClose");
    const copyBtn = document.getElementById("cwWalletCopyBtn");
    const walletNumberEl = document.getElementById("cwWalletNumber");

    function open() {
      overlay.classList.add("open");
    }
    function close() {
      overlay.classList.remove("open");
    }

    fab.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    copyBtn.addEventListener("click", () => {
      const number = walletNumberEl.textContent.trim();
      const done = () => {
        copyBtn.classList.add("copied");
        setTimeout(() => copyBtn.classList.remove("copied"), 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(number).then(done).catch(() => {});
      } else {
        const temp = document.createElement("textarea");
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

  function init() {
    injectStyles();
    buildMarkup();
    wire();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.ContactWidget = { LINKS };
})();
