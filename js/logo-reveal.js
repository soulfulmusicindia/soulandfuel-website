// Logo reveal — captures scroll/wheel to drive animation without moving page
(function () {
  var reveal = document.getElementById("logoReveal");
  if (!reveal) return;

  var mask = reveal.querySelector(".logo-reveal-mask");
  var hint = reveal.querySelector(".logo-reveal-hint");
  var content = reveal.querySelector(".logo-reveal-content");

  var startLogoSize = window.innerWidth < 768 ? 65 : 30;
  var endLogoSize = 500;
  var totalDelta = 0;
  var targetDelta = window.innerHeight * 2.5;
  var done = false;
  var progress = 0;
  var smoothProgress = 0;

  // Lock page scroll during reveal
  document.body.style.overflow = "hidden";
  window.scrollTo(0, 0);

  function render() {
    if (done) return;

    // Smooth interpolation
    smoothProgress += (progress - smoothProgress) * 0.08;
    var eased = 1 - Math.pow(1 - smoothProgress, 3);

    // Logo mask grows
    var logoSize = startLogoSize + (endLogoSize - startLogoSize) * eased;
    mask.style.webkitMaskSize = logoSize + "vw auto, 100% 100%";
    mask.style.maskSize = logoSize + "vw auto, 100% 100%";

    // 3D depth
    var tz = eased * 80;
    mask.style.transform = "translateZ(" + tz + "px) scale(" + (1 + eased * 0.03) + ")";

    // Background image zooms out
    if (content) {
      var bgScale = 2.5 - eased * 1.5;
      content.style.transform = "scale(" + bgScale + ")";
    }

    // Fade out overlay in last 20%
    if (smoothProgress > 0.8) {
      var fade = (smoothProgress - 0.8) / 0.2;
      reveal.style.opacity = 1 - fade;
    }

    // Hide hint
    if (hint && smoothProgress > 0.02) {
      hint.style.opacity = "0";
    }

    if (smoothProgress > 0.98) {
      finish();
      return;
    }

    requestAnimationFrame(render);
  }

  function finish() {
    if (done) return;
    done = true;
    document.body.style.overflow = "";
    reveal.style.opacity = "0";
    reveal.style.pointerEvents = "none";
    setTimeout(function () {
      reveal.remove();
    }, 400);
  }

  // Capture wheel events to drive progress
  function onWheel(e) {
    if (done) return;
    e.preventDefault();
    totalDelta += Math.abs(e.deltaY);
    progress = Math.min(totalDelta / targetDelta, 1);
  }

  // Capture touch for mobile
  var touchStartY = 0;
  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (done) return;
    e.preventDefault();
    var dy = touchStartY - e.touches[0].clientY;
    if (dy > 0) {
      totalDelta += dy;
      progress = Math.min(totalDelta / targetDelta, 1);
    }
    touchStartY = e.touches[0].clientY;
  }

  reveal.addEventListener("wheel", onWheel, { passive: false });
  reveal.addEventListener("touchstart", onTouchStart, { passive: true });
  reveal.addEventListener("touchmove", onTouchMove, { passive: false });

  // Click to skip
  reveal.addEventListener("click", finish);

  // Start render loop
  requestAnimationFrame(render);
  // Keep it running
  (function loop() {
    if (!done) {
      requestAnimationFrame(render);
      requestAnimationFrame(loop);
    }
  })();
})();
