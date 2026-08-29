/* ============================================================
   Shared/yt-player.js
   أداة مشتركة لتحميل يوتيوب IFrame API مرة واحدة بس، واستخراج
   ID الفيديو من أي رابط يوتيوب، عشان نقدر نستخدم مشغّل يوتيوب
   الحقيقي (YT.Player) بدل الـ iframe العادي — وده اللي بيخلينا نقدر
   نتحكم في الجودة برمجيًا (setPlaybackQuality) بدل ما نعتمد على
   شريط تحكم يوتيوب الأصلي (اللي بقينا بنغطيه بالكامل في الصفحات).
   ============================================================ */

(function () {
  let apiLoadingPromise = null;

  function extractYouTubeId(url) {
    try {
      const u = new URL(url);

      if (u.hostname.includes("youtu.be")) {
        return u.pathname.replace("/", "") || null;
      }

      if (u.hostname.includes("youtube.com")) {
        if (u.pathname === "/watch" && u.searchParams.get("v")) {
          return u.searchParams.get("v");
        }
        if (u.pathname.startsWith("/embed/")) {
          return u.pathname.split("/embed/")[1].split(/[/?]/)[0] || null;
        }
        if (u.pathname.startsWith("/shorts/")) {
          return u.pathname.split("/shorts/")[1].split(/[/?]/)[0] || null;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  // بيحمّل سكريبت يوتيوب مرة واحدة بس مهما اتنادت الدالة دي من كذا مكان،
  // وبيرجع Promise بـ window.YT بمجرد ما يبقى جاهز للاستخدام.
  function loadIframeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (apiLoadingPromise) return apiLoadingPromise;

    apiLoadingPromise = new Promise((resolve) => {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prevCallback === "function") prevCallback();
        resolve(window.YT);
      };

      if (!document.getElementById("youtube-iframe-api-script")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    });

    return apiLoadingPromise;
  }

  window.YTPlayerHelper = { extractYouTubeId, loadIframeApi };
})();
