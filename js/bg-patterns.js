// Animated architectural background patterns
(function () {
  var bg = document.querySelector(".page-bg");
  if (!bg) return;

  var type = bg.className.replace("page-bg ", "bg-").replace("page-bg", "");

  function interiorPattern() {
    var lines = [];
    var w = 1400, h = 4000;
    // Horizontal ruled lines
    for (var y = 0; y < h; y += 120) {
      lines.push('<line x1="0" y1="' + y + '" x2="' + w + '" y2="' + y + '"/>');
    }
    // Vertical accent lines
    for (var x = 100; x < w; x += 280) {
      lines.push('<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + h + '"/>');
    }
    // Rectangles (floor plans / rooms)
    var rects = [
      [80, 200, 320, 240], [500, 350, 280, 180], [900, 150, 360, 300],
      [150, 700, 240, 200], [600, 800, 400, 260], [1050, 680, 220, 220],
      [50, 1300, 300, 280], [480, 1200, 340, 200], [920, 1350, 280, 240],
      [200, 1900, 260, 200], [650, 1800, 320, 280], [1000, 2000, 240, 180],
      [100, 2500, 380, 220], [550, 2600, 260, 300], [950, 2450, 300, 260],
      [250, 3100, 300, 240], [700, 3000, 280, 280], [1080, 3200, 220, 200]
    ];
    rects.forEach(function (r) {
      lines.push('<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" rx="1"/>');
    });
    // Diagonal lines (perspective / vanishing point hints)
    lines.push('<line x1="0" y1="0" x2="700" y2="500"/>');
    lines.push('<line x1="1400" y1="0" x2="700" y2="500"/>');
    lines.push('<line x1="0" y1="1500" x2="700" y2="2000"/>');
    lines.push('<line x1="1400" y1="1500" x2="700" y2="2000"/>');
    lines.push('<line x1="0" y1="3000" x2="700" y2="3500"/>');
    lines.push('<line x1="1400" y1="3000" x2="700" y2="3500"/>');
    // Circles (design accents)
    var circles = [
      [350, 500, 40], [1050, 900, 30], [200, 1600, 50],
      [800, 2300, 35], [1100, 2800, 45], [400, 3300, 30]
    ];
    circles.forEach(function (c) {
      lines.push('<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '"/>');
    });
    // Golden ratio arcs
    lines.push('<path d="M 300 400 A 100 100 0 0 1 400 300"/>');
    lines.push('<path d="M 900 1100 A 80 80 0 0 0 980 1020"/>');
    lines.push('<path d="M 500 2200 A 120 120 0 0 1 620 2080"/>');

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin slice">' + lines.join("") + '</svg>';
  }

  if (bg.classList.contains("bg-interior")) {
    bg.innerHTML = interiorPattern();
  }

  // Parallax scroll
  var svg = bg.querySelector("svg");
  if (!svg) return;

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY || window.pageYOffset;
        svg.style.transform = "translateY(" + (-scrollY * 0.15) + "px)";
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
