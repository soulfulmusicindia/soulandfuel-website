// Logo reveal — white overlay with logo cutout, 3D zoom on scroll
(function () {
  var reveal = document.getElementById("logoReveal");
  if (!reveal) return;

  var mask = reveal.querySelector(".logo-reveal-mask");
  var hint = reveal.querySelector(".logo-reveal-hint");
  var startSize = window.innerWidth < 768 ? 65 : 30;
  var endSize = 400;
  var scrollRange = window.innerHeight * 2;
  var done = false;

  // Lock scroll briefly on load
  document.body.style.overflow = "hidden";
  setTimeout(function () {
    document.body.style.overflow = "";
  }, 600);

  function update() {
    if (done) return;

    var scrollY = window.scrollY || window.pageYOffset;
    var progress = Math.min(scrollY / scrollRange, 1);

    // Ease out cubic for smooth deceleration
    var eased = 1 - Math.pow(1 - progress, 3);

    // Mask size grows
    var size = startSize + (endSize - startSize) * eased;
    mask.style.webkitMaskSize = size + "vw auto, 100% 100%";
    mask.style.maskSize = size + "vw auto, 100% 100%";

    // 3D depth — mask pushes toward viewer
    var translateZ = eased * 150;
    var rotateX = (1 - eased) * 2;
    var scale = 1 + eased * 0.1;
    mask.style.transform = "translateZ(" + translateZ + "px) rotateX(" + rotateX + "deg) scale(" + scale + ")";

    // Fade out white overlay in last 30%
    if (progress > 0.7) {
      var fadeProgress = (progress - 0.7) / 0.3;
      mask.style.opacity = 1 - fadeProgress;
    } else {
      mask.style.opacity = 1;
    }

    // Hide hint immediately on scroll
    if (hint && progress > 0.02) {
      hint.style.opacity = "0";
      hint.style.transform = "translateX(-50%) translateY(20px)";
    }

    if (progress >= 1) {
      done = true;
      reveal.classList.add("is-done");

      // Scroll back to top smoothly so page starts from the beginning
      setTimeout(function () {
        reveal.remove();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 500);
    }
  }

  // Click to skip
  reveal.addEventListener("click", function () {
    done = true;
    document.body.style.overflow = "";
    reveal.classList.add("is-done");
    setTimeout(function () {
      reveal.remove();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 500);
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
