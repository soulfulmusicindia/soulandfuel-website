// Living marble — animated stone veins with mouse distortion
(function () {
  var bg = document.querySelector(".page-bg");
  if (!bg) return;

  var canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:0;";
  var ctx = canvas.getContext("2d");

  var w, h;
  var scale = 0.5;
  function resize() {
    w = Math.floor((document.documentElement.clientWidth || window.innerWidth) * scale);
    h = Math.floor((document.documentElement.clientHeight || window.innerHeight) * scale);
    canvas.width = w;
    canvas.height = h;
  }
  resize();
  setTimeout(resize, 100);
  window.addEventListener("resize", resize);

  var mouse = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5 };
  document.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX / (document.documentElement.clientWidth || window.innerWidth);
    mouse.y = e.clientY / (document.documentElement.clientHeight || window.innerHeight);
  });

  // Simplex-inspired noise
  var perm = new Uint8Array(512);
  (function () {
    var p = new Uint8Array(256);
    for (var i = 0; i < 256; i++) p[i] = i;
    for (var i = 255; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (var i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad(hash, x, y) {
    var h = hash & 3;
    var u = h < 2 ? x : y;
    var v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  function noise(x, y) {
    var X = Math.floor(x) & 255;
    var Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    var u = fade(x);
    var v = fade(y);
    var A = perm[X] + Y;
    var B = perm[X + 1] + Y;
    return lerp(
      lerp(grad(perm[A], x, y), grad(perm[B], x - 1, y), u),
      lerp(grad(perm[A + 1], x, y - 1), grad(perm[B + 1], x - 1, y - 1), u),
      v
    );
  }

  function fbm(x, y, octaves) {
    var val = 0, amp = 0.5, freq = 1;
    for (var i = 0; i < octaves; i++) {
      val += amp * noise(x * freq, y * freq);
      amp *= 0.5;
      freq *= 2.1;
    }
    return val;
  }

  var time = 0;
  var imgData = null;

  function draw() {
    time += 0.004;

    mouse.sx += (mouse.x - mouse.sx) * 0.02;
    mouse.sy += (mouse.y - mouse.sy) * 0.02;

    if (!imgData || imgData.width !== w || imgData.height !== h) {
      imgData = ctx.createImageData(w, h);
    }
    var data = imgData.data;

    for (var py = 0; py < h; py++) {
      for (var px = 0; px < w; px++) {
        var nx = px / w * 3;
        var ny = py / h * 3;

        // Mouse distortion — warp the coordinate space near cursor
        var mdx = nx / 3 - mouse.sx;
        var mdy = ny / 3 - mouse.sy;
        var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 0.3) {
          var warp = (1 - mdist / 0.3) * 0.4;
          nx += mdx * warp;
          ny += mdy * warp;
        }

        // Domain warping — key to marble look
        var warp1x = fbm(nx + time * 0.5, ny, 4);
        var warp1y = fbm(nx, ny + time * 0.3, 4);

        var warp2x = fbm(nx + warp1x * 2 + time * 0.3, ny + warp1y * 2, 4);
        var warp2y = fbm(nx + warp1x * 2, ny + warp1y * 2 + time * 0.2, 4);

        var val = fbm(nx + warp2x * 1.5, ny + warp2y * 1.5, 5);

        // Map to marble colors — parchment base with warm veins
        val = val * 0.5 + 0.5;

        // Vein detection — sharp transitions become veins
        var vein = Math.abs(Math.sin(val * 12 + warp2x * 6));
        vein = Math.pow(vein, 3);

        // Base: parchment (243, 237, 227)
        // Veins: warm brown/ember tones
        var baseR = 243, baseG = 237, baseB = 227;
        var veinR = 200, veinG = 185, veinB = 168;
        var deepR = 180, deepG = 155, deepB = 130;

        var t1 = vein;
        var t2 = (1 - vein) * val * 0.3;

        var r = baseR - t1 * (baseR - veinR) - t2 * (baseR - deepR);
        var g = baseG - t1 * (baseG - veinG) - t2 * (baseG - deepG);
        var b = baseB - t1 * (baseB - veinB) - t2 * (baseB - deepB);

        // Subtle ember in deep veins
        var ember = Math.max(0, 1 - vein * 3) * val * 0.15;
        r += ember * 30;
        g -= ember * 10;
        b -= ember * 15;

        var idx = (py * w + px) * 4;
        data[idx] = Math.max(0, Math.min(255, r));
        data[idx + 1] = Math.max(0, Math.min(255, g));
        data[idx + 2] = Math.max(0, Math.min(255, b));
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    requestAnimationFrame(draw);
  }

  draw();
})();
