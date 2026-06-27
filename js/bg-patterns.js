// Flowing lines — smooth organic curves that drift like smoke
(function () {
  var bg = document.querySelector(".page-bg");
  if (!bg) return;

  var canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;";
  bg.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var w, h;
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  var lines = [];
  var numLines = 8;

  for (var i = 0; i < numLines; i++) {
    var points = [];
    var numPoints = 6;
    for (var j = 0; j < numPoints; j++) {
      points.push({
        x: Math.random() * 1.4 - 0.2,
        y: Math.random() * 1.4 - 0.2,
        vx: (Math.random() - 0.5) * 0.0004,
        vy: (Math.random() - 0.5) * 0.0003,
        originX: 0,
        originY: 0,
        angle: Math.random() * Math.PI * 2,
        radius: 0.02 + Math.random() * 0.06,
        speed: 0.003 + Math.random() * 0.005
      });
      points[j].originX = points[j].x;
      points[j].originY = points[j].y;
    }
    lines.push({
      points: points,
      opacity: 0.06 + Math.random() * 0.08,
      width: 0.8 + Math.random() * 1.2,
      color: Math.random() > 0.5 ? "194, 84, 42" : "21, 20, 15"
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var pts = line.points;

      // Update points — gentle circular orbiting around origin
      for (var j = 0; j < pts.length; j++) {
        var p = pts[j];
        p.angle += p.speed;
        p.x = p.originX + Math.cos(p.angle) * p.radius;
        p.y = p.originY + Math.sin(p.angle * 0.7) * p.radius;

        // Slowly drift the origin
        p.originX += p.vx;
        p.originY += p.vy;

        // Soft bounce at edges
        if (p.originX < -0.1 || p.originX > 1.1) p.vx *= -1;
        if (p.originY < -0.1 || p.originY > 1.1) p.vy *= -1;
      }

      // Draw smooth curve through points
      ctx.beginPath();
      ctx.strokeStyle = "rgba(" + line.color + ", " + line.opacity + ")";
      ctx.lineWidth = line.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      var sx = pts[0].x * w;
      var sy = pts[0].y * h;
      ctx.moveTo(sx, sy);

      for (var j = 0; j < pts.length - 1; j++) {
        var xc = (pts[j].x * w + pts[j + 1].x * w) / 2;
        var yc = (pts[j].y * h + pts[j + 1].y * h) / 2;
        ctx.quadraticCurveTo(pts[j].x * w, pts[j].y * h, xc, yc);
      }
      ctx.quadraticCurveTo(
        pts[pts.length - 1].x * w,
        pts[pts.length - 1].y * h,
        pts[pts.length - 1].x * w,
        pts[pts.length - 1].y * h
      );
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
