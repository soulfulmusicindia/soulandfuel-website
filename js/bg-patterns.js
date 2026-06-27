// Living architectural mesh — 3D fabric grid with mouse interaction
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

  var mouse = { x: w / 2, y: h / 2 };
  document.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  var cols = 28;
  var rows = 22;
  var spacing = Math.max(w, h) / Math.min(cols, rows);
  var time = 0;
  var focalLength = 300;

  // Create grid points
  var points = [];
  for (var row = 0; row < rows; row++) {
    for (var col = 0; col < cols; col++) {
      points.push({
        baseX: (col - cols / 2) * spacing,
        baseY: (row - rows / 2) * spacing,
        baseZ: 0,
        x: 0, y: 0, z: 0,
        sx: 0, sy: 0,
        col: col, row: row
      });
    }
  }

  function project(x, y, z) {
    var zOffset = z + 600;
    if (zOffset < 1) zOffset = 1;
    var scale = focalLength / zOffset;
    return {
      x: w / 2 + x * scale,
      y: h / 2 + y * scale,
      scale: scale
    };
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    time += 0.008;

    var halfW = w / 2;
    var halfH = h / 2;
    var mouseOffsetX = (mouse.x - halfW) / halfW;
    var mouseOffsetY = (mouse.y - halfH) / halfH;

    // Update points with wave deformation
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      var nx = p.col / cols;
      var ny = p.row / rows;

      // Multiple layered waves for organic movement
      var wave1 = Math.sin(nx * 4 + time * 1.5) * Math.cos(ny * 3 + time * 1.2) * 80;
      var wave2 = Math.sin(nx * 2.5 + ny * 3.5 + time * 0.8) * 50;
      var wave3 = Math.cos(nx * 6 + time * 2) * Math.sin(ny * 5 + time * 1.7) * 30;
      var ripple = Math.sin(Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(ny - 0.5, 2)) * 8 - time * 2) * 40;

      // Mouse influence — push points away in z
      var dx = (p.baseX - (mouse.x - halfW) * 1.5);
      var dy = (p.baseY - (mouse.y - halfH) * 1.5);
      var dist = Math.sqrt(dx * dx + dy * dy);
      var mouseWave = Math.max(0, 1 - dist / 400) * 120;

      p.z = wave1 + wave2 + wave3 + ripple + mouseWave;

      // Subtle symmetric x/y drift
      p.x = p.baseX + Math.sin(ny * 3 + time) * 8 * mouseOffsetX;
      p.y = p.baseY + Math.cos(nx * 3 + time) * 8 * mouseOffsetY;

      // Tilt the whole grid based on mouse
      var tiltX = mouseOffsetY * 0.3;
      var tiltY = mouseOffsetX * -0.3;
      var cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      var cosY = Math.cos(tiltY), sinY = Math.sin(tiltY);

      var rx = p.x * cosY - p.z * sinY;
      var rz1 = p.x * sinY + p.z * cosY;
      var ry = p.y * cosX - rz1 * sinX;
      var rz = p.y * sinX + rz1 * cosX;

      var proj = project(rx, ry, rz);
      p.sx = proj.x;
      p.sy = proj.y;
      p.depth = rz;
      p.projScale = proj.scale;
    }

    // Draw connections
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var idx = row * cols + col;
        var p = points[idx];

        var depthNorm = (p.depth + 200) / 400;
        depthNorm = Math.max(0, Math.min(1, depthNorm));

        // Color: mix ember and ink based on depth
        var r = Math.round(21 + depthNorm * (194 - 21));
        var g = Math.round(20 + depthNorm * (84 - 20));
        var b = Math.round(15 + depthNorm * (42 - 15));
        var alpha = 0.03 + depthNorm * 0.09;

        // Horizontal connection
        if (col < cols - 1) {
          var next = points[idx + 1];
          ctx.beginPath();
          ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
          ctx.lineWidth = 0.3 + depthNorm * 0.8;
          ctx.moveTo(p.sx, p.sy);
          ctx.lineTo(next.sx, next.sy);
          ctx.stroke();
        }

        // Vertical connection
        if (row < rows - 1) {
          var below = points[idx + cols];
          ctx.beginPath();
          ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
          ctx.lineWidth = 0.3 + depthNorm * 0.8;
          ctx.moveTo(p.sx, p.sy);
          ctx.lineTo(below.sx, below.sy);
          ctx.stroke();
        }

        // Draw node dots at intersections
        if ((col + row) % 3 === 0) {
          var dotSize = 0.5 + depthNorm * 2;
          ctx.beginPath();
          ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (alpha * 1.5) + ")";
          ctx.arc(p.sx, p.sy, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
