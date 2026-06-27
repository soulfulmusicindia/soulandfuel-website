// Symmetric 3D flowing lines — mirrored curves with depth
(function () {
  var bg = document.querySelector(".page-bg");
  if (!bg) return;

  var canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;";
  bg.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var w, h, cx, cy;
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cx = w / 2;
    cy = h / 2;
  }
  resize();
  window.addEventListener("resize", resize);

  var time = 0;
  var numLines = 12;
  var numPoints = 80;

  function draw() {
    ctx.clearRect(0, 0, w, h);
    time += 0.004;

    for (var i = 0; i < numLines; i++) {
      var phase = (i / numLines) * Math.PI * 2;
      var depth = 0.4 + Math.sin(time * 0.5 + phase) * 0.3;
      var opacity = 0.04 + depth * 0.08;
      var lineWidth = 0.5 + depth * 1.5;

      // Use ember for some lines, ink for others
      var isEmber = i % 3 === 0;
      var color = isEmber ? "194, 84, 42" : "21, 20, 15";

      // Draw right half
      ctx.beginPath();
      ctx.strokeStyle = "rgba(" + color + ", " + opacity + ")";
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      for (var j = 0; j < numPoints; j++) {
        var t = j / numPoints;
        var y = t * h;

        var wave1 = Math.sin(t * 3 + time * 1.2 + phase) * (80 + i * 15) * depth;
        var wave2 = Math.sin(t * 5 + time * 0.8 + phase * 1.5) * (40 + i * 8) * depth;
        var wave3 = Math.sin(t * 1.5 + time * 0.5 + phase * 0.7) * (60 + i * 12) * depth;

        var x = cx + wave1 + wave2 * 0.5 + wave3 * 0.3;

        // 3D perspective — curves closer to center appear further away
        var perspectiveScale = 0.7 + depth * 0.3;
        x = cx + (x - cx) * perspectiveScale;
        var py = cy + (y - cy) * perspectiveScale;

        if (j === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();

      // Mirror — draw left half (symmetric)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(" + color + ", " + opacity + ")";
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      for (var j = 0; j < numPoints; j++) {
        var t = j / numPoints;
        var y = t * h;

        var wave1 = Math.sin(t * 3 + time * 1.2 + phase) * (80 + i * 15) * depth;
        var wave2 = Math.sin(t * 5 + time * 0.8 + phase * 1.5) * (40 + i * 8) * depth;
        var wave3 = Math.sin(t * 1.5 + time * 0.5 + phase * 0.7) * (60 + i * 12) * depth;

        var x = cx - (wave1 + wave2 * 0.5 + wave3 * 0.3);

        var perspectiveScale = 0.7 + depth * 0.3;
        x = cx + (x - cx) * perspectiveScale;
        var py = cy + (y - cy) * perspectiveScale;

        if (j === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();
    }

    // Center axis glow line
    ctx.beginPath();
    ctx.strokeStyle = "rgba(194, 84, 42, 0.03)";
    ctx.lineWidth = 1;
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();

    requestAnimationFrame(draw);
  }

  draw();
})();
