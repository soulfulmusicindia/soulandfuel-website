// Light through blinds — sunlight filtering into a designed space
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

  var time = 0;

  function draw() {
    ctx.clearRect(0, 0, w, h);
    time += 0.003;

    // Mouse influence on light angle
    var mouseAngle = ((mouse.x / w) - 0.5) * 0.4;
    var mouseWarmth = (mouse.y / h);

    // === Layer 1: Broad window light wash ===
    var lightX = w * 0.3 + Math.sin(time * 0.5) * w * 0.15;
    var lightW = w * 0.5;
    var grad1 = ctx.createLinearGradient(lightX - lightW / 2, 0, lightX + lightW / 2, 0);
    grad1.addColorStop(0, "rgba(243, 237, 227, 0)");
    grad1.addColorStop(0.3, "rgba(217, 180, 140, 0.04)");
    grad1.addColorStop(0.5, "rgba(230, 210, 180, 0.07)");
    grad1.addColorStop(0.7, "rgba(217, 180, 140, 0.04)");
    grad1.addColorStop(1, "rgba(243, 237, 227, 0)");
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, w, h);

    // === Layer 2: Venetian blind bands ===
    var numBands = 12;
    var bandAngle = 0.15 + mouseAngle + Math.sin(time * 0.7) * 0.05;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(bandAngle);

    for (var i = 0; i < numBands; i++) {
      var y = (i - numBands / 2) * (h / (numBands - 2));
      var bandH = h / (numBands * 1.8);
      var breathe = Math.sin(time * 1.2 + i * 0.5) * 0.3 + 0.7;
      var warmR = 230 + Math.sin(time + i) * 15;
      var warmG = 200 + Math.sin(time * 0.8 + i) * 15;
      var warmB = 160 + Math.sin(time * 0.6 + i) * 10;
      var alpha = 0.025 * breathe + mouseWarmth * 0.015;

      // Light band
      var bandGrad = ctx.createLinearGradient(0, y - bandH, 0, y + bandH);
      bandGrad.addColorStop(0, "rgba(" + Math.round(warmR) + "," + Math.round(warmG) + "," + Math.round(warmB) + ", 0)");
      bandGrad.addColorStop(0.3, "rgba(" + Math.round(warmR) + "," + Math.round(warmG) + "," + Math.round(warmB) + "," + alpha + ")");
      bandGrad.addColorStop(0.5, "rgba(" + Math.round(warmR) + "," + Math.round(warmG) + "," + Math.round(warmB) + "," + (alpha * 1.5) + ")");
      bandGrad.addColorStop(0.7, "rgba(" + Math.round(warmR) + "," + Math.round(warmG) + "," + Math.round(warmB) + "," + alpha + ")");
      bandGrad.addColorStop(1, "rgba(" + Math.round(warmR) + "," + Math.round(warmG) + "," + Math.round(warmB) + ", 0)");

      ctx.fillStyle = bandGrad;
      ctx.fillRect(-w, y - bandH, w * 2, bandH * 2);
    }

    ctx.restore();

    // === Layer 3: Shadow edges where blinds block light ===
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(bandAngle);

    for (var i = 0; i < numBands - 1; i++) {
      var y = (i - numBands / 2 + 0.5) * (h / (numBands - 2));
      var shadowH = 3 + Math.sin(time + i * 0.8) * 1;
      var shadowAlpha = 0.02 + Math.sin(time * 0.9 + i) * 0.008;

      ctx.fillStyle = "rgba(21, 20, 15, " + shadowAlpha + ")";
      ctx.fillRect(-w, y - shadowH / 2, w * 2, shadowH);
    }

    ctx.restore();

    // === Layer 4: Dust particles in the light ===
    for (var i = 0; i < 30; i++) {
      var px = (Math.sin(time * 0.3 + i * 7.3) * 0.5 + 0.5) * w;
      var py = (Math.cos(time * 0.2 + i * 4.7) * 0.5 + 0.5) * h;
      var pr = 1 + Math.sin(time * 2 + i) * 0.5;
      var pAlpha = 0.04 + Math.sin(time + i * 2) * 0.025;

      // Only show dust in light areas (center-ish)
      var distFromCenter = Math.abs(px - lightX) / (lightW / 2);
      if (distFromCenter < 1) {
        pAlpha *= (1 - distFromCenter);
        ctx.beginPath();
        ctx.fillStyle = "rgba(217, 180, 140, " + pAlpha + ")";
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // === Layer 5: Mouse spotlight — like holding a light ===
    var spotGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 250);
    spotGrad.addColorStop(0, "rgba(240, 220, 190, 0.06)");
    spotGrad.addColorStop(0.4, "rgba(230, 200, 160, 0.03)");
    spotGrad.addColorStop(1, "rgba(243, 237, 227, 0)");
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 250, 0, Math.PI * 2);
    ctx.fill();

    // Warm edge where mouse light hits "wall"
    var edgeGlow = ctx.createRadialGradient(mouse.x, mouse.y, 180, mouse.x, mouse.y, 280);
    edgeGlow.addColorStop(0, "rgba(194, 84, 42, 0)");
    edgeGlow.addColorStop(0.5, "rgba(194, 84, 42, 0.015)");
    edgeGlow.addColorStop(1, "rgba(194, 84, 42, 0)");
    ctx.fillStyle = edgeGlow;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 280, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(draw);
  }

  draw();
})();
