// Liquid gradient mesh — premium morphing colors
(function () {
  var bg = document.querySelector(".page-bg");
  if (!bg) return;

  var canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:0;";
  var ctx = canvas.getContext("2d");

  var w, h;
  function resize() {
    w = canvas.width = document.documentElement.clientWidth || window.innerWidth;
    h = canvas.height = document.documentElement.clientHeight || window.innerHeight;
  }
  setTimeout(resize, 50);
  resize();
  window.addEventListener("resize", resize);

  var mouse = { x: w / 2, y: h / 2, smoothX: w / 2, smoothY: h / 2 };
  document.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  var time = 0;

  var blobs = [
    { cx: 0.25, cy: 0.3, r: 0.35, color: [210, 190, 165], speed: 0.4, phase: 0 },
    { cx: 0.75, cy: 0.3, r: 0.35, color: [210, 190, 165], speed: 0.4, phase: Math.PI },
    { cx: 0.5,  cy: 0.7, r: 0.4,  color: [194, 130, 90],  speed: 0.3, phase: 1.5 },
    { cx: 0.2,  cy: 0.8, r: 0.3,  color: [180, 170, 155], speed: 0.35, phase: 2.5 },
    { cx: 0.8,  cy: 0.8, r: 0.3,  color: [180, 170, 155], speed: 0.35, phase: Math.PI + 2.5 },
    { cx: 0.5,  cy: 0.2, r: 0.3,  color: [194, 84, 42],   speed: 0.25, phase: 4 },
    { cx: 0.35, cy: 0.5, r: 0.25, color: [160, 150, 135], speed: 0.5,  phase: 0.8 },
    { cx: 0.65, cy: 0.5, r: 0.25, color: [160, 150, 135], speed: 0.5,  phase: Math.PI + 0.8 }
  ];

  function draw() {
    time += 0.006;

    // Smooth mouse follow
    mouse.smoothX += (mouse.x - mouse.smoothX) * 0.03;
    mouse.smoothY += (mouse.y - mouse.smoothY) * 0.03;

    var mouseNX = mouse.smoothX / w;
    var mouseNY = mouse.smoothY / h;

    // Clear with base color
    ctx.fillStyle = "rgb(243, 237, 227)";
    ctx.fillRect(0, 0, w, h);

    // Use globalCompositeOperation for rich blending
    ctx.globalCompositeOperation = "multiply";

    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];

      // Organic movement — lissajous curves + mouse influence
      var bx = b.cx + Math.sin(time * b.speed + b.phase) * 0.12 + (mouseNX - 0.5) * 0.08;
      var by = b.cy + Math.cos(time * b.speed * 0.7 + b.phase * 1.3) * 0.1 + (mouseNY - 0.5) * 0.06;
      var br = b.r + Math.sin(time * b.speed * 0.5 + b.phase) * 0.06;

      var px = bx * w;
      var py = by * h;
      var pr = br * Math.max(w, h);

      var grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
      grad.addColorStop(0, "rgba(" + b.color[0] + "," + b.color[1] + "," + b.color[2] + ", 0.15)");
      grad.addColorStop(0.5, "rgba(" + b.color[0] + "," + b.color[1] + "," + b.color[2] + ", 0.06)");
      grad.addColorStop(1, "rgba(243, 237, 227, 0)");

      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouse glow blob — warm ember
    ctx.globalCompositeOperation = "screen";
    var mGrad = ctx.createRadialGradient(mouse.smoothX, mouse.smoothY, 0, mouse.smoothX, mouse.smoothY, 200);
    mGrad.addColorStop(0, "rgba(194, 84, 42, 0.035)");
    mGrad.addColorStop(0.5, "rgba(217, 122, 82, 0.015)");
    mGrad.addColorStop(1, "rgba(243, 237, 227, 0)");
    ctx.beginPath();
    ctx.fillStyle = mGrad;
    ctx.arc(mouse.smoothX, mouse.smoothY, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";

    requestAnimationFrame(draw);
  }

  draw();
})();
