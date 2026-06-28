// Parallax depth — elements move at different scroll speeds
(function () {
  if (!document.body.classList.contains("parallax-page")) return;
  if (window.innerWidth < 768) return;

  var elements = [];

  // Collect parallax targets with different speeds
  document.querySelectorAll(".cat-hero h1").forEach(function (el) {
    elements.push({ el: el, speed: -0.08, max: 40 });
  });
  document.querySelectorAll(".cat-hero .eyebrow").forEach(function (el) {
    elements.push({ el: el, speed: -0.04, max: 20 });
  });
  document.querySelectorAll(".cat-hero .dek").forEach(function (el) {
    elements.push({ el: el, speed: -0.06, max: 30 });
  });
  document.querySelectorAll(".section-head h2").forEach(function (el) {
    elements.push({ el: el, speed: -0.05, max: 30 });
  });
  document.querySelectorAll(".project-list-grid .work-tile").forEach(function (el, i) {
    var row = Math.floor(i / 4);
    var speed = 0.02 + (i % 4) * 0.008;
    if (row % 2 === 1) speed *= -1;
    elements.push({ el: el, speed: speed, max: 25 });
  });
  document.querySelectorAll(".editorial-card").forEach(function (el, i) {
    elements.push({ el: el, speed: 0.015 + i * 0.005, max: 20 });
  });
  document.querySelectorAll(".video-grid-item").forEach(function (el, i) {
    elements.push({ el: el, speed: 0.02 + (i % 3) * 0.008, max: 20 });
  });

  if (!elements.length) return;

  var ticking = false;

  function update() {
    var scrollY = window.scrollY || window.pageYOffset;
    var viewH = window.innerHeight;

    for (var i = 0; i < elements.length; i++) {
      var item = elements[i];
      var rect = item.el.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var offset = (center - viewH / 2) * item.speed;

      // Clamp
      if (offset > item.max) offset = item.max;
      if (offset < -item.max) offset = -item.max;

      item.el.style.transform = "translateY(" + offset + "px)";
    }

    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  // Initial position
  update();
})();
