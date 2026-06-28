// Soul & Fuel — minimal, dependency-free interaction layer

document.addEventListener("DOMContentLoaded", () => {
  // Nav: solid background after scrolling past hero
  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  const onScroll = () => {
    if (window.scrollY > 40) {
      nav.classList.add("is-scrolled");
    } else if (!nav.classList.contains("is-solid")) {
      nav.classList.remove("is-scrolled");
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("is-open");
      toggle.setAttribute(
        "aria-expanded",
        links.classList.contains("is-open") ? "true" : "false"
      );
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("is-open"))
    );
  }

  // Reveal-on-scroll for sections marked .reveal
  const targets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && targets.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add("is-visible"));
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Project grid — show 6 at a time with Load More
  const projectGrid = document.querySelector(".project-list-grid");
  const loadMoreBtn = document.querySelector(".btn-more-projects");
  const filterBtns = document.querySelectorAll(".filter-btn");
  if (projectGrid && loadMoreBtn) {
    var perPage = 8;
    var allTiles = Array.from(projectGrid.querySelectorAll(".work-tile"));
    var shown = 0;

    function showBatch() {
      var visibleTiles = allTiles.filter(function (t) { return !t.classList.contains("is-hidden"); });
      var count = 0;
      for (var i = 0; i < visibleTiles.length; i++) {
        if (!visibleTiles[i].classList.contains("is-overflow")) count++;
        if (count <= shown) continue;
        if (count > shown + perPage) break;
        visibleTiles[i].classList.remove("is-overflow");
      }
      shown += perPage;
      var remaining = visibleTiles.filter(function (t) { return t.classList.contains("is-overflow"); });
      if (remaining.length === 0) loadMoreBtn.style.display = "none";
      else loadMoreBtn.style.display = "";
    }

    function resetGrid() {
      shown = 0;
      allTiles.forEach(function (t) { t.classList.add("is-overflow"); });
      showBatch();
    }

    resetGrid();
    loadMoreBtn.addEventListener("click", showBatch);

    if (filterBtns.length) {
      filterBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
          btn.classList.add("is-active");
          var filter = btn.dataset.filter;
          allTiles.forEach(function (tile) {
            if (filter === "all" || tile.dataset.type === filter) {
              tile.classList.remove("is-hidden");
            } else {
              tile.classList.add("is-hidden");
            }
          });
          resetGrid();
        });
      });
    }
  }

  // Lightbox for project grids
  const projectDetailGrid = document.querySelector(".project-grid");
  if (projectDetailGrid) {
    const cells = Array.from(projectDetailGrid.querySelectorAll(".ph"));
    if (cells.length) {
      let current = 0;
      const box = document.createElement("div");
      box.className = "lightbox";
      box.innerHTML =
        '<button class="lightbox-close">&times;</button>' +
        '<button class="lightbox-prev">&lsaquo;</button>' +
        '<button class="lightbox-next">&rsaquo;</button>' +
        '<img src="" alt="">' +
        '<span class="lightbox-counter"></span>';
      document.body.appendChild(box);
      const lbImg = box.querySelector("img");
      const counter = box.querySelector(".lightbox-counter");
      const show = (i) => {
        current = (i + cells.length) % cells.length;
        const img = cells[current].querySelector("img");
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        counter.textContent = (current + 1) + " / " + cells.length;
      };
      cells.forEach((cell, i) => {
        cell.style.cursor = "pointer";
        cell.addEventListener("click", () => { show(i); box.classList.add("is-open"); });
      });
      box.querySelector(".lightbox-close").addEventListener("click", () => box.classList.remove("is-open"));
      box.querySelector(".lightbox-prev").addEventListener("click", () => show(current - 1));
      box.querySelector(".lightbox-next").addEventListener("click", () => show(current + 1));
      box.addEventListener("click", (e) => { if (e.target === box) box.classList.remove("is-open"); });
      document.addEventListener("keydown", (e) => {
        if (!box.classList.contains("is-open")) return;
        if (e.key === "Escape") box.classList.remove("is-open");
        if (e.key === "ArrowLeft") show(current - 1);
        if (e.key === "ArrowRight") show(current + 1);
      });
    }
  }

  // Video grid — fetches playlist items via YouTube Data API v3
  const YT_API_KEY = "AIzaSyAwcjrfDyRoThkLJ-dZVCfFuTFDGW40RM4";
  const playSvg = '<svg viewBox="0 0 24 24"><polygon points="8,5 20,12 8,19"/></svg>';

  document.querySelectorAll(".video-grid").forEach((grid) => {
    const playlistId = grid.dataset.playlist;
    const perPage = parseInt(grid.dataset.perPage, 10) || 12;
    const loadMoreBtn = grid.parentElement.querySelector(".btn-load-more");
    let allVideos = [];
    let shown = 0;
    let nextPageToken = "";

    function renderBatch() {
      const batch = allVideos.slice(shown, shown + perPage);
      batch.forEach((v) => {
        const card = document.createElement("div");
        card.className = "video-grid-item reveal is-visible";
        card.innerHTML =
          '<div class="thumb-wrap">' +
            '<img src="https://img.youtube.com/vi/' + v.id + '/maxresdefault.jpg" alt="' + v.title.replace(/"/g, "&quot;") + '" loading="lazy">' +
            '<span class="play-icon">' + playSvg + '</span>' +
          '</div>' +
          '<div class="vid-iframe-wrap"></div>' +
          '<div class="vid-title">' + v.title + '</div>';
        card.addEventListener("click", () => {
          if (card.classList.contains("is-playing")) return;
          card.classList.add("is-playing");
          card.querySelector(".vid-iframe-wrap").innerHTML =
            '<iframe src="https://www.youtube.com/embed/' + v.id + '?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
        });
        grid.appendChild(card);
      });
      shown += batch.length;
      if (shown >= allVideos.length && !nextPageToken) {
        loadMoreBtn.style.display = "none";
      } else {
        loadMoreBtn.style.display = "";
      }
    }

    function fetchVideos(pageToken) {
      const url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" +
        playlistId + "&key=" + YT_API_KEY + (pageToken ? "&pageToken=" + pageToken : "");
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            grid.innerHTML = '<p class="yt-note">Could not load videos. Please check the API key.</p>';
            return;
          }
          nextPageToken = data.nextPageToken || "";
          data.items.forEach((item) => {
            const vid = item.snippet.resourceId && item.snippet.resourceId.videoId;
            if (vid) allVideos.push({ id: vid, title: item.snippet.title });
          });
          if (nextPageToken) {
            fetchVideos(nextPageToken);
          } else {
            renderBatch();
          }
        });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        renderBatch();
      });
    }

    fetchVideos("");
  });
});
