(function () {
  function isChromeBrowser() {
    const ua = navigator.userAgent || "";

    const isChromium = /Chrome\//.test(ua) || /CriOS\//.test(ua); // Chrome على ديسكتوب/أندرويد/آيفون
    const isEdge = /Edg\//.test(ua) || /EdgA\//.test(ua) || /EdgiOS\//.test(ua);
    const isOpera = /OPR\//.test(ua) || /OPiOS\//.test(ua);
    const isSamsung = /SamsungBrowser/.test(ua);
    const isUC = /UCBrowser/.test(ua);
    const isBrave = !!(
      navigator.brave && typeof navigator.brave.isBrave === "function"
    );

    return isChromium && !isEdge && !isOpera && !isSamsung && !isUC && !isBrave;
  }

  if (isChromeBrowser()) return;

  function showBlockOverlay() {
    const overlay = document.createElement("div");
    overlay.setAttribute("dir", "rtl");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "background:#10171A",
      "color:#F1E9D6",
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "justify-content:center",
      "text-align:center",
      "padding:24px",
      "font-family:'Cairo', Tahoma, sans-serif",
    ].join(";");

    overlay.innerHTML = `
      <h1 style="font-size:22px; margin:0 0 12px;">لازم تفتح المنصة من متصفح Google Chrome</h1>
      <p style="max-width:420px; line-height:1.8; opacity:.85; margin:0 0 18px;">
        المنصة متاحة بس من خلال متصفح Chrome. من فضلك حمّل المتصفح وافتح الرابط من خلاله.
      </p>
      <a href="https://www.google.com/chrome/" target="_blank" rel="noopener"
         style="background:#3FB39C; color:#10171A; padding:10px 22px; border-radius:10px;
                font-weight:700; text-decoration:none;">
        تحميل Chrome
      </a>
    `;

    document.documentElement.innerHTML = "";
    document.documentElement.appendChild(document.createElement("body"));
    document.body.appendChild(overlay);
  }

  if (document.body) {
    showBlockOverlay();
  } else {
    document.addEventListener("DOMContentLoaded", showBlockOverlay);
  }
})();
