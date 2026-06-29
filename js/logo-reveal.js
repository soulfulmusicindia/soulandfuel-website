// Logo reveal — hero zooms out while logo zooms in, merging into the page
(function () {
  var reveal = document.getElementById("logoReveal");
  if (!reveal) return;

  var mask = reveal.querySelector(".logo-reveal-mask");
  var hint = reveal.querySelector(".logo-reveal-hint");
  var startLogoSize = window.innerWidth < 768 ? 65 : 30;
  var endLogoSize = 500;
  var startHeroScale = 3;
  var endHeroScale = 1;
  var scrollRange = window.innerHeight * 2;
  var done = false;

  // Push page content down so scroll space exists for the reveal
  var spacer = document.createElement("div");
  spacer.style.height = scrollRange + "px";
  spacer.id = "revealSpacer";
  document.body.insertBefore(spacer, document.body.firstChild);

  // Fix the actual page content below the spacer
  var pageContent = document.querySelectorAll("body > *:not(#logoReveal):not(#revealSpacer)");
  pageContent.forEach(function (el) {
    el.style.position = "relative";
  });

  // Lock scroll briefly
  document.body.style.overflow = "hidden";
  setTimeout(function () {
    document.body.style.overflow = "";
  }, 500);

  // Set initial hero scale — zoomed in
  var heroFrames = document.querySelector(".hero-frames");
  var heroSection = document.querySelector(".hero");
  if (heroSection) {
    heroSection.style.transform = "scale(" + startHeroScale + ")";
    heroSection.style.transformOrigin = "center center";
    heroSection.style.transition = "none";
  }

  function update() {
    if (done) return;

    var scrollY = window.scrollY || window.pageYOffset;
    var progress = Math.min(scrollY / scrollRange, 1);

    // Ease out cubic
    var eased = 1 - Math.pow(1 - progress, 3);

    // Logo mask grows
    var logoSize = startLogoSize + (endLogoSize - startLogoSize) * eased;
    mask.style.webkitMaskSize = logoSize + "vw auto, 100% 100%";
    mask.style.maskSize = logoSize + "vw auto, 100% 100%";

    // 3D depth on mask
    var tz = eased * 100;
    mask.style.transform = "translateZ(" + tz + "px) scale(" + (1 + eased * 0.05) + ")";

    // Hero zooms out from startHeroScale to 1
    if (heroSection) {
      var heroScale = startHeroScale + (endHeroScale - startHeroScale) * eased;
      heroSection.style.transform = "scale(" + heroScale + ")";
    }

    // Fade out white overlay in last 25%
    if (progress > 0.75) {
      var fadeProgress = (progress - 0.75) / 0.25;
      mask.style.opacity = 1 - fadeProgress;
    } else {
      mask.style.opacity = 1;
    }

    // Hide hint on scroll
    if (hint && progress > 0.02) {
      hint.style.opacity = "0";
      hint.style.transform = "translateX(-50%) translateY(20px)";
    }

    if (progress >= 1) {
      finish();
    }
  }

  function finish() {
    if (done) return;
    done = true;

    // Reset hero to normal
    if (heroSection) {
      heroSection.style.transform = "";
      heroSection.style.transition = "";
    }

    // Remove spacer and reveal
    reveal.classList.add("is-done");
    setTimeout(function () {
      reveal.remove();
      var sp = document.getElementById("revealSpacer");
      if (sp) sp.remove();
      // Reset page content positioning
      pageContent.forEach(function (el) {
        el.style.position = "";
      });
      // Set scroll to top without animation
      window.scrollTo(0, 0);
    }, 500);
  }

  // Click to skip
  reveal.addEventListener("click", function () {
    finish();
  });

  // Touch support
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
