// Animated architectural background — continuously moving geometric shapes
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

  var shapes = [];
  var count = 35;

  function rand(a, b) { return Math.random() * (b - a) + a; }

  for (var i = 0; i < count; i++) {
    var type = Math.random();
    shapes.push({
      x: rand(0, 1),
      y: rand(0, 1),
      size: rand(30, 160),
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.003, 0.003),
      driftX: rand(-0.15, 0.15),
      driftY: rand(-0.1, 0.1),
      opacity: rand(0.024, 0.072),
      type: type < 0.3 ? "rect" : type < 0.5 ? "circle" : type < 0.7 ? "line" : type < 0.85 ? "cross" : "arc"
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < shapes.length; i++) {
      var s = shapes[i];

      s.rotation += s.rotSpeed;
      s.x += s.driftX / w;
      s.y += s.driftY / h;

      if (s.x < -0.1) s.x = 1.1;
      if (s.x > 1.1) s.x = -0.1;
      if (s.y < -0.1) s.y = 1.1;
      if (s.y > 1.1) s.y = -0.1;

      var px = s.x * w;
      var py = s.y * h;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(s.rotation);
      ctx.strokeStyle = "rgba(21, 20, 15, " + s.opacity + ")";
      ctx.lineWidth = 0.8;
      ctx.beginPath();

      if (s.type === "rect") {
        ctx.rect(-s.size / 2, -s.size / 3, s.size, s.size * 0.66);
      } else if (s.type === "circle") {
        ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
      } else if (s.type === "line") {
        ctx.moveTo(-s.size / 2, 0);
        ctx.lineTo(s.size / 2, 0);
        ctx.moveTo(0, -s.size / 3);
        ctx.lineTo(0, s.size / 3);
      } else if (s.type === "cross") {
        var half = s.size / 2;
        ctx.moveTo(-half, -half);
        ctx.lineTo(half, half);
        ctx.moveTo(half, -half);
        ctx.lineTo(-half, half);
      } else if (s.type === "arc") {
        ctx.arc(0, 0, s.size / 2, 0, Math.PI * 1.5);
      }

      ctx.stroke();
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
