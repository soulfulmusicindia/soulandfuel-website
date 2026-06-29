// Preloader — counts to 100% then fades out
(function () {
  var preloader = document.querySelector(".preloader");
  if (!preloader) return;

  var counter = preloader.querySelector(".preloader-counter");
  var current = 0;
  var target = 100;
  var duration = 1800;
  var start = null;

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tick(timestamp) {
    if (!start) start = timestamp;
    var elapsed = timestamp - start;
    var progress = Math.min(elapsed / duration, 1);
    current = Math.round(easeOut(progress) * target);
    counter.textContent = current + "%";

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      setTimeout(function () {
        preloader.classList.add("is-done");
        setTimeout(function () {
          preloader.remove();
        }, 700);
      }, 200);
    }
  }

  requestAnimationFrame(tick);
})();
