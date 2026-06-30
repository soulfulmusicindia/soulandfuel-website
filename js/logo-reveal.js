// Logo reveal — wheel/touch drives logo expand + hero zoom out
(function () {
  var reveal = document.getElementById("logoReveal");
  if (!reveal) return;

  var navType = performance.getEntriesByType("navigation")[0];
  var isReload = navType && navType.type === "reload";
  if (sessionStorage.getItem("logoRevealed") && !isReload) {
    reveal.remove();
    return;
  }
  sessionStorage.setItem("logoRevealed", "1");

  var bg = reveal.querySelector(".logo-reveal-bg");
  var white = reveal.querySelector(".logo-reveal-white");
  var hint = reveal.querySelector(".logo-reveal-hint");
  var isMobile = window.innerWidth < 768;
  var startMask = isMobile ? 60 : 30;
  var endMask = 500;
  var ratio = endMask / startMask;
  var totalNeeded = 306;
  var accumulated = 0;
  var progress = 0;
  var smooth = 0;
  var done = false;

  // Rate-limit: cap how much scroll can accumulate per time window
  var windowStart = 0;
  var windowAccum = 0;
  var maxPerWindow = 80;
  var windowMs = 150;

  document.body.style.overflow = "hidden";
  window.scrollTo(0, 0);

  function addScroll(amount) {
    var now = performance.now();
    if (now - windowStart > windowMs) {
      windowStart = now;
      windowAccum = 0;
    }
    var add = Math.min(amount, maxPerWindow - windowAccum);
    if (add <= 0) return;
    windowAccum += add;
    accumulated += add;
    progress = Math.min(accumulated / totalNeeded, 1);
  }

  function tick() {
    if (done) return;

    var diff = progress - smooth;
    var step = diff * 0.04;
    if (Math.abs(step) > 0.013) step = Math.sign(step) * 0.013;
    smooth += step;

    // Logarithmic interpolation: grows proportionally so early
    // changes feel tiny (30→31vw) instead of jumping (30→60vw)
    var maskSize = startMask * Math.pow(ratio, smooth);
    white.style.webkitMaskSize = maskSize + "vw auto, 100% 100%";
    white.style.maskSize = maskSize + "vw auto, 100% 100%";

    bg.style.transform = "scale(" + (2 - smooth) + ")";

    if (smooth > 0.55) {
      reveal.style.opacity = 1 - (smooth - 0.55) / 0.45;
    }

    if (hint && smooth > 0.03) {
      hint.style.opacity = "0";
    }

    if (smooth > 0.97) {
      finish();
      return;
    }

    requestAnimationFrame(tick);
  }

  function finish() {
    if (done) return;
    done = true;
    document.body.style.overflow = "";
    reveal.style.transition = "opacity 0.6s ease-out";
    reveal.style.opacity = "0";
    reveal.style.pointerEvents = "none";
    setTimeout(function () { reveal.remove(); }, 800);
  }

  reveal.addEventListener("wheel", function (ev) {
    if (done) return;
    ev.preventDefault();
    // Fixed increment per event — ignores deltaY magnitude entirely
    // so behavior is identical across all mice and scroll settings
    addScroll(12);
  }, { passive: false });

  var lastTouchY = 0;
  reveal.addEventListener("touchstart", function (ev) {
    lastTouchY = ev.touches[0].clientY;
  }, { passive: true });
  reveal.addEventListener("touchmove", function (ev) {
    if (done) return;
    ev.preventDefault();
    var dy = lastTouchY - ev.touches[0].clientY;
    if (dy > 0) addScroll(dy * 1.5);
    lastTouchY = ev.touches[0].clientY;
  }, { passive: false });

  reveal.addEventListener("click", finish);

  requestAnimationFrame(tick);
})();
