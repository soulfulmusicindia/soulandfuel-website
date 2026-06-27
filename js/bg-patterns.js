// Ambient light — warm floating orbs like light in an interior space
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

  var mouse = { x: w / 2, y: h / 2, active: false };
  document.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  function rand(a, b) { return Math.random() * (b - a) + a; }

  // Light orbs — soft glowing circles like warm ambient light
  var orbs = [];
  for (var i = 0; i < 20; i++) {
    orbs.push({
      x: rand(0, w),
      y: rand(0, h),
      baseRadius: rand(60, 220),
      radius: 0,
      vx: rand(-0.3, 0.3),
      vy: rand(-0.2, 0.2),
      phase: rand(0, Math.PI * 2),
      breathSpeed: rand(0.005, 0.015),
      warm: Math.random() > 0.4
    });
  }

  // Mouse trail particles
  var particles = [];
  var maxParticles = 40;

  var time = 0;
  var lastMouse = { x: mouse.x, y: mouse.y };

  function draw() {
    time += 0.01;

    // Soft fade instead of hard clear — creates trails
    ctx.fillStyle = "rgba(243, 237, 227, 0.08)";
    ctx.fillRect(0, 0, w, h);

    // Spawn mouse particles on movement
    if (mouse.active) {
      var dx = mouse.x - lastMouse.x;
      var dy = mouse.y - lastMouse.y;
      var speed = Math.sqrt(dx * dx + dy * dy);
      if (speed > 2 && particles.length < maxParticles) {
        particles.push({
          x: mouse.x,
          y: mouse.y,
          radius: rand(3, 12),
          life: 1,
          decay: rand(0.008, 0.02),
          vx: rand(-1, 1),
          vy: rand(-1, 1),
          warm: Math.random() > 0.3
        });
      }
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;
    }

    // Draw and update mouse particles
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= p.decay;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
      if (p.warm) {
        grad.addColorStop(0, "rgba(194, 84, 42, " + (p.life * 0.25) + ")");
        grad.addColorStop(1, "rgba(194, 84, 42, 0)");
      } else {
        grad.addColorStop(0, "rgba(217, 122, 82, " + (p.life * 0.2) + ")");
        grad.addColorStop(1, "rgba(217, 122, 82, 0)");
      }
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ambient light orbs
    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i];

      // Breathing radius
      o.phase += o.breathSpeed;
      o.radius = o.baseRadius + Math.sin(o.phase) * (o.baseRadius * 0.3);

      // Slow drift
      o.x += o.vx;
      o.y += o.vy;

      // Mouse repulsion — orbs gently push away from cursor
      var mdx = o.x - mouse.x;
      var mdy = o.y - mouse.y;
      var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 300) {
        var force = (1 - mdist / 300) * 0.8;
        o.x += (mdx / mdist) * force;
        o.y += (mdy / mdist) * force;
      }

      // Wrap edges softly
      if (o.x < -o.radius) o.x = w + o.radius;
      if (o.x > w + o.radius) o.x = -o.radius;
      if (o.y < -o.radius) o.y = h + o.radius;
      if (o.y > h + o.radius) o.y = -o.radius;

      // Draw soft radial gradient
      var grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
      if (o.warm) {
        grad.addColorStop(0, "rgba(194, 84, 42, 0.045)");
        grad.addColorStop(0.4, "rgba(217, 122, 82, 0.025)");
        grad.addColorStop(1, "rgba(243, 237, 227, 0)");
      } else {
        grad.addColorStop(0, "rgba(75, 85, 96, 0.035)");
        grad.addColorStop(0.4, "rgba(75, 85, 96, 0.015)");
        grad.addColorStop(1, "rgba(243, 237, 227, 0)");
      }
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle vignette
    var vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
    vignette.addColorStop(0, "rgba(243, 237, 227, 0)");
    vignette.addColorStop(1, "rgba(231, 222, 207, 0.15)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(draw);
  }

  // Initial clear
  ctx.fillStyle = "rgba(243, 237, 227, 1)";
  ctx.fillRect(0, 0, w, h);

  draw();
})();
