// Constellation network — connected particles with mouse magnetism
(function () {
  var bg = document.querySelector(".page-bg");
  if (!bg) return;

  var canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;";
  bg.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var w, h, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  var mouse = { x: -1000, y: -1000 };
  document.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  document.addEventListener("mouseleave", function () {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  function rand(a, b) { return Math.random() * (b - a) + a; }

  var connectDist = 140;
  var mouseDist = 200;
  var count = Math.min(Math.floor((w * h) / 8000), 150);

  var dots = [];
  for (var i = 0; i < count; i++) {
    dots.push({
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-0.4, 0.4),
      vy: rand(-0.4, 0.4),
      r: rand(1.2, 2.8),
      layer: Math.random(),
      pulse: rand(0, Math.PI * 2),
      pulseSpeed: rand(0.01, 0.03)
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Update dots
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.pulse += d.pulseSpeed;

      // Mouse magnetism — attract gently
      var mdx = mouse.x - d.x;
      var mdy = mouse.y - d.y;
      var mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < mouseDist && mDist > 1) {
        var force = (1 - mDist / mouseDist) * 0.02;
        d.vx += (mdx / mDist) * force;
        d.vy += (mdy / mDist) * force;
      }

      // Dampen velocity
      d.vx *= 0.995;
      d.vy *= 0.995;

      d.x += d.vx;
      d.y += d.vy;

      // Bounce off edges softly
      if (d.x < 0) { d.x = 0; d.vx *= -0.5; }
      if (d.x > w) { d.x = w; d.vx *= -0.5; }
      if (d.y < 0) { d.y = 0; d.vy *= -0.5; }
      if (d.y > h) { d.y = h; d.vy *= -0.5; }
    }

    // Draw connections
    for (var i = 0; i < dots.length; i++) {
      for (var j = i + 1; j < dots.length; j++) {
        var dx = dots[i].x - dots[j].x;
        var dy = dots[i].y - dots[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectDist) {
          var alpha = (1 - dist / connectDist);

          // Lines near mouse glow ember
          var avgX = (dots[i].x + dots[j].x) / 2;
          var avgY = (dots[i].y + dots[j].y) / 2;
          var toMouse = Math.sqrt(Math.pow(avgX - mouse.x, 2) + Math.pow(avgY - mouse.y, 2));
          var mouseGlow = Math.max(0, 1 - toMouse / (mouseDist * 1.5));

          var r = Math.round(21 + mouseGlow * 173);
          var g = Math.round(20 + mouseGlow * 64);
          var b = Math.round(15 + mouseGlow * 27);

          ctx.beginPath();
          ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + (alpha * 0.12) + ")";
          ctx.lineWidth = alpha * 1.2;
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw dots
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var pulseR = d.r + Math.sin(d.pulse) * 0.8;

      // Dots near mouse glow ember and grow
      var toMouse = Math.sqrt(Math.pow(d.x - mouse.x, 2) + Math.pow(d.y - mouse.y, 2));
      var mouseGlow = Math.max(0, 1 - toMouse / mouseDist);

      var dotR = pulseR + mouseGlow * 3;
      var r = Math.round(21 + mouseGlow * 173);
      var g = Math.round(20 + mouseGlow * 64);
      var b = Math.round(15 + mouseGlow * 27);
      var alpha = 0.1 + mouseGlow * 0.5 + d.layer * 0.08;

      // Outer glow for mouse-near dots
      if (mouseGlow > 0.1) {
        ctx.beginPath();
        var glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, dotR * 4);
        glow.addColorStop(0, "rgba(194, 84, 42, " + (mouseGlow * 0.08) + ")");
        glow.addColorStop(1, "rgba(194, 84, 42, 0)");
        ctx.fillStyle = glow;
        ctx.arc(d.x, d.y, dotR * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core dot
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
      ctx.arc(d.x, d.y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouse cursor glow
    if (mouse.x > 0) {
      var cursorGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
      cursorGlow.addColorStop(0, "rgba(194, 84, 42, 0.04)");
      cursorGlow.addColorStop(0.5, "rgba(194, 84, 42, 0.015)");
      cursorGlow.addColorStop(1, "rgba(194, 84, 42, 0)");
      ctx.beginPath();
      ctx.fillStyle = cursorGlow;
      ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
