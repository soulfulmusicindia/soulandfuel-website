// Logo reveal — wheel/touch drives logo expand + hero zoom out
(function () {
  var reveal = document.getElementById("logoReveal");
  if (!reveal) return;

  var bg = reveal.querySelector(".logo-reveal-bg");
  var white = reveal.querySelector(".logo-reveal-white");
  var hint = reveal.querySelector(".logo-reveal-hint");
  var isMobile = window.innerWidth < 768;
  var startMask = isMobile ? 60 : 30;
  var endMask = 500;
  var totalNeeded = 1500;
  var accumulated = 0;
  var progress = 0;
  var smooth = 0;
  var done = false;
  var raf;

  document.body.style.overflow = "hidden";
  window.scrollTo(0, 0);

  function tick() {
    if (done) return;

    smooth += (progress - smooth) * 0.06;
    var e = 1 - Math.pow(1 - smooth, 3);

    var maskSize = startMask + (endMask - startMask) * e;
    white.style.webkitMaskSize = maskSize + "vw auto, 100% 100%";
    white.style.maskSize = maskSize + "vw auto, 100% 100%";

    var bgScale = 2 - e * 1;
    bg.style.transform = "scale(" + bgScale + ")";

    if (smooth > 0.75) {
      var fade = (smooth - 0.75) / 0.25;
      reveal.style.opacity = 1 - fade;
    }

    if (hint && smooth > 0.01) {
      hint.style.opacity = "0";
    }

    if (smooth > 0.97) {
      finish();
      return;
    }

    raf = requestAnimationFrame(tick);
  }

  function finish() {
    if (done) return;
    done = true;
    document.body.style.overflow = "";
    reveal.style.opacity = "0";
    reveal.style.pointerEvents = "none";
    setTimeout(function () { reveal.remove(); }, 500);
  }

  reveal.addEventListener("wheel", function (e) {
    if (done) return;
    e.preventDefault();
    accumulated += Math.abs(e.deltaY);
    progress = Math.min(accumulated / totalNeeded, 1);
  }, { passive: false });

  var lastTouchY = 0;
  reveal.addEventListener("touchstart", function (e) {
    lastTouchY = e.touches[0].clientY;
  }, { passive: true });
  reveal.addEventListener("touchmove", function (e) {
    if (done) return;
    e.preventDefault();
    var dy = lastTouchY - e.touches[0].clientY;
    if (dy > 0) {
      accumulated += dy * 2;
      progress = Math.min(accumulated / totalNeeded, 1);
    }
    lastTouchY = e.touches[0].clientY;
  }, { passive: false });

  reveal.addEventListener("click", finish);

  raf = requestAnimationFrame(tick);
  // Keep loop alive
  var interval = setInterval(function () {
    if (done) { clearInterval(interval); return; }
    raf = requestAnimationFrame(tick);
  }, 16);
})();
