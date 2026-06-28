// Apple-style scroll-driven animations
(function () {
  if (!document.body.classList.contains("parallax-page")) return;
  if (window.innerWidth < 768) return;

  // Utility: map scroll progress (0–1) to a value range
  function lerp(start, end, t) {
    t = Math.max(0, Math.min(1, t));
    return start + (end - start) * t;
  }

  function getProgress(el, offset) {
    offset = offset || 0;
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight;
    // 0 = element just entered bottom, 1 = element passed top
    var raw = 1 - (rect.top - offset) / vh;
    return Math.max(0, Math.min(1, raw));
  }

  // === Hero: title scales up and fades as you scroll ===
  var heroTitle = document.querySelector(".cat-hero h1");
  var heroEyebrow = document.querySelector(".cat-hero .eyebrow");
  var heroDek = document.querySelector(".cat-hero .dek");
  var heroSection = document.querySelector(".cat-hero");
  var filterBar = document.querySelector(".filter-bar");

  // === Project tiles: zoom + rotate in ===
  var tiles = document.querySelectorAll(".project-list-grid .work-tile");

  // === Section headings: slide from left ===
  var sectionHeads = document.querySelectorAll(".section-head h2");

  // === Editorial cards: stagger scale up ===
  var editCards = document.querySelectorAll(".editorial-card");

  // === Video items ===
  var vidItems = document.querySelectorAll(".video-grid-item");

  var ticking = false;

  function animate() {
    var scrollY = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;

    // Hero: scale + opacity driven by scroll
    if (heroSection && heroTitle) {
      var heroH = heroSection.offsetHeight;
      var heroProgress = Math.min(1, scrollY / (heroH * 0.6));

      heroTitle.style.transform = "scale(" + lerp(1, 1.15, heroProgress) + ") translateY(" + lerp(0, -30, heroProgress) + "px)";
      heroTitle.style.opacity = lerp(1, 0, heroProgress);

      if (heroEyebrow) {
        heroEyebrow.style.transform = "translateY(" + lerp(0, -20, heroProgress) + "px)";
        heroEyebrow.style.opacity = lerp(1, 0, heroProgress * 1.5);
      }
      if (heroDek) {
        heroDek.style.transform = "translateY(" + lerp(0, -15, heroProgress) + "px)";
        heroDek.style.opacity = lerp(1, 0, heroProgress * 1.3);
      }
      if (filterBar) {
        filterBar.style.transform = "translateY(" + lerp(0, -10, heroProgress) + "px)";
        filterBar.style.opacity = lerp(1, 0, heroProgress * 1.8);
      }
    }

    // Tiles: each tile zooms + slight rotate based on its position
    for (var i = 0; i < tiles.length; i++) {
      var tile = tiles[i];
      if (tile.style.display === "none" || tile.classList.contains("is-overflow") || tile.classList.contains("is-hidden")) continue;

      var p = getProgress(tile, vh * 0.15);
      var scale = lerp(0.85, 1, p);
      var rotateY = lerp(3, 0, p);
      var rotateX = lerp(2, 0, p);
      var opacity = lerp(0.3, 1, p);
      var ty = lerp(40, 0, p);

      tile.style.transform = "perspective(1000px) scale(" + scale + ") rotateY(" + rotateY + "deg) rotateX(" + rotateX + "deg) translateY(" + ty + "px)";
      tile.style.opacity = opacity;
    }

    // Section headings: slide in from left + scale
    for (var i = 0; i < sectionHeads.length; i++) {
      var h = sectionHeads[i];
      var p = getProgress(h, vh * 0.2);
      var tx = lerp(-60, 0, p);
      var opacity = lerp(0, 1, p);
      h.style.transform = "translateX(" + tx + "px)";
      h.style.opacity = opacity;
    }

    // Editorial cards: stagger zoom
    for (var i = 0; i < editCards.length; i++) {
      var card = editCards[i];
      var p = getProgress(card, vh * 0.1);
      var delay = i * 0.08;
      var adjustedP = Math.max(0, Math.min(1, (p - delay) / (1 - delay)));
      var scale = lerp(0.8, 1, adjustedP);
      var opacity = lerp(0, 1, adjustedP);
      var ty = lerp(50, 0, adjustedP);
      card.style.transform = "scale(" + scale + ") translateY(" + ty + "px)";
      card.style.opacity = opacity;
    }

    // Video items: slide up + fade
    for (var i = 0; i < vidItems.length; i++) {
      var vid = vidItems[i];
      var p = getProgress(vid, vh * 0.1);
      var ty = lerp(30, 0, p);
      var opacity = lerp(0.2, 1, p);
      vid.style.transform = "translateY(" + ty + "px)";
      vid.style.opacity = opacity;
    }

    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(animate);
      ticking = true;
    }
  }, { passive: true });

  // Run on load
  animate();
})();
