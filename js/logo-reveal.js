// Logo reveal — logo mask zooms in on scroll to reveal content
(function () {
  var reveal = document.getElementById("logoReveal");
  if (!reveal) return;

  var mask = reveal.querySelector(".logo-reveal-mask");
  var startSize = window.innerWidth < 768 ? 70 : 35;
  var endSize = 500;
  var scrollRange = window.innerHeight * 1.2;
  var done = false;

  function update() {
    if (done) return;

    var scrollY = window.scrollY || window.pageYOffset;
    var progress = Math.min(scrollY / scrollRange, 1);

    // Ease out cubic
    var eased = 1 - Math.pow(1 - progress, 3);

    var size = startSize + (endSize - startSize) * eased;
    mask.style.webkitMaskSize = size + "vw auto";
    mask.style.maskSize = size + "vw auto";

    // Fade out the white background as mask grows
    var bgOpacity = Math.max(0, 1 - progress * 1.5);
    reveal.style.background = "rgba(255,255,255," + bgOpacity + ")";

    if (progress >= 1) {
      done = true;
      reveal.classList.add("is-done");
      setTimeout(function () {
        reveal.remove();
      }, 600);
    }
  }

  // Auto-scroll hint — slight bounce if user doesn't scroll
  var hintTimeout = setTimeout(function () {
    if (!done && window.scrollY < 10) {
      reveal.style.cursor = "pointer";
      // Pulse the mask slightly
      var pulse = startSize + 3;
      mask.style.webkitMaskSize = pulse + "vw auto";
      mask.style.maskSize = pulse + "vw auto";
      setTimeout(function () {
        mask.style.webkitMaskSize = startSize + "vw auto";
        mask.style.maskSize = startSize + "vw auto";
      }, 400);
    }
  }, 2500);

  // Click to skip
  reveal.addEventListener("click", function () {
    done = true;
    reveal.classList.add("is-done");
    setTimeout(function () {
      reveal.remove();
    }, 600);
  });

  // Touch support — swipe up to reveal
  var touchStartY = 0;
  reveal.addEventListener("touchstart", function (e) {
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  reveal.addEventListener("touchmove", function (e) {
    var dy = touchStartY - e.changedTouches[0].screenY;
    if (dy > 0) {
      window.scrollBy(0, dy * 0.5);
    }
  }, { passive: true });

  window.addEventListener("scroll", function () {
    requestAnimationFrame(update);
  }, { passive: true });

  update();
})();
