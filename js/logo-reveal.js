// Logo reveal — white overlay with logo cutout, zooms on scroll
(function () {
  var reveal = document.getElementById("logoReveal");
  if (!reveal) return;

  var mask = reveal.querySelector(".logo-reveal-mask");
  var hint = reveal.querySelector(".logo-reveal-hint");
  var startSize = window.innerWidth < 768 ? 65 : 30;
  var endSize = 350;
  var scrollRange = window.innerHeight * 1.5;
  var done = false;

  // Prevent scroll initially for a brief moment
  document.body.style.overflow = "hidden";
  setTimeout(function () {
    document.body.style.overflow = "";
  }, 800);

  function update() {
    if (done) return;

    var scrollY = window.scrollY || window.pageYOffset;
    var progress = Math.min(scrollY / scrollRange, 1);

    // Ease out
    var eased = 1 - Math.pow(1 - progress, 3);

    var size = startSize + (endSize - startSize) * eased;
    mask.style.webkitMaskSize = size + "vw auto, 100% 100%";
    mask.style.maskSize = size + "vw auto, 100% 100%";

    // Fade out the white overlay as logo grows
    if (progress > 0.6) {
      var fadeProgress = (progress - 0.6) / 0.4;
      mask.style.opacity = 1 - fadeProgress;
    }

    // Hide hint on scroll
    if (hint && progress > 0.05) {
      hint.style.opacity = "0";
    }

    if (progress >= 1) {
      done = true;
      reveal.classList.add("is-done");
      setTimeout(function () {
        reveal.remove();
      }, 600);
    }
  }

  // Click to skip
  reveal.addEventListener("click", function () {
    done = true;
    document.body.style.overflow = "";
    reveal.classList.add("is-done");
    setTimeout(function () {
      reveal.remove();
    }, 600);
  });

  // Touch support for mobile
  var touchStartY = 0;
  reveal.addEventListener("touchstart", function (e) {
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  reveal.addEventListener("touchmove", function (e) {
    var dy = touchStartY - e.changedTouches[0].screenY;
    if (dy > 0) {
      document.body.style.overflow = "";
      window.scrollBy(0, dy * 0.3);
    }
  }, { passive: true });

  window.addEventListener("scroll", function () {
    requestAnimationFrame(update);
  }, { passive: true });

  update();
})();
