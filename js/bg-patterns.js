// 3D animated architectural background
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

  function rand(a, b) { return Math.random() * (b - a) + a; }

  // 3D points that form wireframe cubes, pyramids, and architectural frames
  var objects = [];
  var numObjects = 18;

  for (var i = 0; i < numObjects; i++) {
    var type = Math.random();
    objects.push({
      x: rand(-600, 600),
      y: rand(-400, 400),
      z: rand(200, 800),
      rotX: rand(0, Math.PI * 2),
      rotY: rand(0, Math.PI * 2),
      rotZ: rand(0, Math.PI * 2),
      speedX: rand(-0.004, 0.004),
      speedY: rand(-0.006, 0.006),
      speedZ: rand(-0.003, 0.003),
      driftX: rand(-0.3, 0.3),
      driftY: rand(-0.2, 0.2),
      driftZ: rand(-0.1, 0.1),
      size: rand(40, 120),
      opacity: rand(0.03, 0.1),
      type: type < 0.3 ? "cube" : type < 0.5 ? "pyramid" : type < 0.7 ? "frame" : type < 0.85 ? "octahedron" : "prism"
    });
  }

  // Floating lines (perspective grid)
  var gridLines = [];
  for (var i = 0; i < 12; i++) {
    gridLines.push({
      x1: rand(-800, 800), y1: rand(-500, 500), z1: rand(100, 600),
      x2: rand(-800, 800), y2: rand(-500, 500), z2: rand(100, 600),
      drift: rand(-0.2, 0.2),
      opacity: rand(0.02, 0.06)
    });
  }

  var focalLength = 500;
  var time = 0;

  function project(x, y, z) {
    var scale = focalLength / (focalLength + z);
    return { x: cx + x * scale, y: cy + y * scale, s: scale };
  }

  function rotatePoint(px, py, pz, rx, ry, rz) {
    var cosX = Math.cos(rx), sinX = Math.sin(rx);
    var cosY = Math.cos(ry), sinY = Math.sin(ry);
    var cosZ = Math.cos(rz), sinZ = Math.sin(rz);
    // Rotate Y
    var x1 = px * cosY - pz * sinY;
    var z1 = px * sinY + pz * cosY;
    // Rotate X
    var y1 = py * cosX - z1 * sinX;
    var z2 = py * sinX + z1 * cosX;
    // Rotate Z
    var x2 = x1 * cosZ - y1 * sinZ;
    var y2 = x1 * sinZ + y1 * cosZ;
    return { x: x2, y: y2, z: z2 };
  }

  function drawEdge(p1, p2) {
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
  }

  function getCubeVertices(s) {
    var h = s / 2;
    return [
      [-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h],
      [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]
    ];
  }

  function getPyramidVertices(s) {
    var h = s / 2;
    return [
      [-h, h, -h], [h, h, -h], [h, h, h], [-h, h, h],
      [0, -h, 0]
    ];
  }

  function getOctahedronVertices(s) {
    var h = s / 2;
    return [
      [0, -h, 0], [h, 0, 0], [0, 0, h],
      [-h, 0, 0], [0, 0, -h], [0, h, 0]
    ];
  }

  function getPrismVertices(s) {
    var h = s / 2;
    var t = s * 0.4;
    return [
      [-t, -h, -t], [t, -h, -t], [0, -h, t],
      [-t, h, -t], [t, h, -t], [0, h, t]
    ];
  }

  function getFrameVertices(s) {
    var o = s / 2, i = s * 0.35;
    return [
      [-o, -o, 0], [o, -o, 0], [o, o, 0], [-o, o, 0],
      [-i, -i, 0], [i, -i, 0], [i, i, 0], [-i, i, 0]
    ];
  }

  var cubeEdges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  var pyramidEdges = [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]];
  var octEdges = [[0,1],[0,2],[0,3],[0,4],[5,1],[5,2],[5,3],[5,4],[1,2],[2,3],[3,4],[4,1]];
  var prismEdges = [[0,1],[1,2],[2,0],[3,4],[4,5],[5,3],[0,3],[1,4],[2,5]];
  var frameEdges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

  function draw() {
    ctx.clearRect(0, 0, w, h);
    time += 0.008;

    // Draw floating grid lines
    for (var i = 0; i < gridLines.length; i++) {
      var gl = gridLines[i];
      var wobble = Math.sin(time + i) * 20;
      var p1 = project(gl.x1 + wobble, gl.y1, gl.z1);
      var p2 = project(gl.x2 - wobble, gl.y2, gl.z2);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(21, 20, 15, " + gl.opacity + ")";
      ctx.lineWidth = 0.5;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Draw 3D objects
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];

      obj.rotX += obj.speedX;
      obj.rotY += obj.speedY;
      obj.rotZ += obj.speedZ;
      obj.x += obj.driftX;
      obj.y += obj.driftY;
      obj.z += obj.driftZ;

      // Wrap around
      if (obj.x > 800) obj.x = -800;
      if (obj.x < -800) obj.x = 800;
      if (obj.y > 500) obj.y = -500;
      if (obj.y < -500) obj.y = 500;
      if (obj.z > 900) obj.z = 200;
      if (obj.z < 150) obj.z = 850;

      var vertices, edges;
      if (obj.type === "cube") { vertices = getCubeVertices(obj.size); edges = cubeEdges; }
      else if (obj.type === "pyramid") { vertices = getPyramidVertices(obj.size); edges = pyramidEdges; }
      else if (obj.type === "octahedron") { vertices = getOctahedronVertices(obj.size); edges = octEdges; }
      else if (obj.type === "prism") { vertices = getPrismVertices(obj.size); edges = prismEdges; }
      else { vertices = getFrameVertices(obj.size); edges = frameEdges; }

      var projected = [];
      for (var v = 0; v < vertices.length; v++) {
        var rot = rotatePoint(vertices[v][0], vertices[v][1], vertices[v][2], obj.rotX, obj.rotY, obj.rotZ);
        projected.push(project(rot.x + obj.x, rot.y + obj.y, rot.z + obj.z));
      }

      ctx.beginPath();
      ctx.strokeStyle = "rgba(21, 20, 15, " + obj.opacity + ")";
      ctx.lineWidth = 0.8;

      for (var e = 0; e < edges.length; e++) {
        drawEdge(projected[edges[e][0]], projected[edges[e][1]]);
      }
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
