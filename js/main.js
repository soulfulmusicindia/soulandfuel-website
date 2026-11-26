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
  if (nav) {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

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

  // Section jump dropdowns — one per section, each labelled with its own
  // section; the menu jumps to any section. Multiple can exist on the page.
  const sectionJumps = Array.from(document.querySelectorAll(".section-jump"));
  if (sectionJumps.length) {
    // The mobile nav is taller than --nav-h (logo + links stack), so expose
    // the measured height for the anchor offset in CSS
    const setNavActual = () => {
      document.documentElement.style.setProperty("--nav-actual", nav.offsetHeight + "px");
    };
    setNavActual();
    window.addEventListener("resize", setNavActual, { passive: true });
    window.addEventListener("load", setNavActual);
    if ("ResizeObserver" in window) new ResizeObserver(setNavActual).observe(nav);

    const closeAll = (except) => {
      sectionJumps.forEach((sj) => {
        if (sj === except) return;
        sj.classList.remove("is-open");
        sj.querySelector(".jump-toggle").setAttribute("aria-expanded", "false");
      });
    };

    sectionJumps.forEach((sj) => {
      const toggle = sj.querySelector(".jump-toggle");
      toggle.addEventListener("click", () => {
        const willOpen = !sj.classList.contains("is-open");
        closeAll(sj);
        sj.classList.toggle("is-open", willOpen);
        toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });

      sj.querySelectorAll(".jump-option").forEach((opt) => {
        const target = document.querySelector(opt.getAttribute("href"));
        if (!target) return;
        opt.addEventListener("click", (e) => {
          e.preventDefault();
          closeAll(null);
          const y = target.getBoundingClientRect().top + window.scrollY - (nav.offsetHeight + 16);
          window.scrollTo({ top: y, behavior: "smooth" });
          history.replaceState(null, "", opt.getAttribute("href"));
        });
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".section-jump")) closeAll(null);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll(null);
    });
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
      var revealed = 0;
      for (var i = 0; i < visibleTiles.length; i++) {
        if (!visibleTiles[i].classList.contains("is-overflow")) continue;
        visibleTiles[i].classList.remove("is-overflow");
        revealed++;
        if (revealed >= perPage) break;
      }
      var remaining = visibleTiles.filter(function (t) { return t.classList.contains("is-overflow"); });
      if (remaining.length === 0) loadMoreBtn.style.display = "none";
      else loadMoreBtn.style.display = "";
    }

    function resetGrid() {
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

  // 3D scroll reveal for project photos
  const photoGrid = document.querySelector(".project-grid");
  if (photoGrid) {
    const photos = photoGrid.querySelectorAll(".ph");
    if ("IntersectionObserver" in window && photos.length) {
      const photoObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
            } else {
              entry.target.classList.remove("in-view");
            }
          });
        },
        { threshold: 0.15 }
      );
      photos.forEach((p) => photoObs.observe(p));
    } else {
      photos.forEach((p) => p.classList.add("in-view"));
    }
  }

  // Next project: shown after the last photo, picked from the listing page so
  // new projects are included without any extra upkeep.
  const pageName = (window.location.pathname.split("/").pop() || "").replace(/(\.html)?$/, ".html");
  const nextProject = /^project-.+\.html$/.test(pageName) ? findNextProject(pageName) : Promise.resolve(null);

  nextProject.then((project) => {
    const band = document.querySelector(".contact-band");
    if (!project || !band) return;
    const section = document.createElement("section");
    section.className = "next-project-section wrap";
    section.appendChild(nextProjectCard(project, project.href));
    band.parentNode.insertBefore(section, band);
  });

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
      const prevBtn = box.querySelector(".lightbox-prev");
      const nextBtn = box.querySelector(".lightbox-next");
      let endCard = null;
      // Index cells.length is the "next project" screen. No looping either way.
      const show = (i) => {
        const last = cells.length - (endCard ? 0 : 1);
        current = Math.max(0, Math.min(i, last));
        const atEnd = current === cells.length;
        box.classList.toggle("is-end", atEnd);
        prevBtn.hidden = current === 0;
        nextBtn.hidden = current === last;
        if (atEnd) {
          counter.textContent = "";
          return;
        }
        const img = cells[current].querySelector("img");
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        counter.textContent = (current + 1) + " / " + cells.length;
      };
      nextProject.then((project) => {
        if (!project) return;
        endCard = nextProjectCard(project, project.href + "#view");
        box.appendChild(endCard);
        if (box.classList.contains("is-open")) show(current);
      });
      cells.forEach((cell, i) => {
        cell.style.cursor = "pointer";
        cell.addEventListener("click", () => { show(i); box.classList.add("is-open"); });
      });
      box.querySelector(".lightbox-close").addEventListener("click", () => box.classList.remove("is-open"));
      box.querySelector(".lightbox-prev").addEventListener("click", () => show(current - 1));
      box.querySelector(".lightbox-next").addEventListener("click", () => show(current + 1));
      box.addEventListener("click", (e) => { if (e.target === box) box.classList.remove("is-open"); });
      // Arriving from another project's viewer: carry on in the viewer
      if (window.location.hash === "#view") {
        show(0);
        box.classList.add("is-open");
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      document.addEventListener("keydown", (e) => {
        if (!box.classList.contains("is-open")) return;
        if (e.key === "Escape") box.classList.remove("is-open");
        if (e.key === "ArrowLeft") show(current - 1);
        if (e.key === "ArrowRight") show(current + 1);
      });
      // Touch swipe support
      let touchStartX = 0;
      let touchStartY = 0;
      box.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });
      box.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;
        if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
        if (dx < 0) show(current + 1);
        else show(current - 1);
      }, { passive: true });
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

// Picks a random unseen project of the same type (residential or commercial).
function findNextProject(current) {
  return fetch("work-interior-architecture.html")
    .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const all = Array.from(doc.querySelectorAll(".project-list-grid .work-tile")).map((tile) => {
        const kicker = tile.querySelector(".kicker").textContent.trim();
        const img = tile.querySelector("img");
        return {
          href: tile.getAttribute("href"),
          title: tile.querySelector("h3").textContent.trim(),
          kicker: kicker,
          type: tile.dataset.type,
          img: img.getAttribute("src"),
          imgStyle: img.getAttribute("style")
        };
      });
      const here = all.findIndex((p) => p.href === current);
      if (here === -1) return null;
      const me = all[here];

      let seen = [];
      try { seen = JSON.parse(sessionStorage.getItem("sf-seen-projects")) || []; } catch (e) {}
      if (!seen.includes(current)) seen.push(current);
      let pool = all.filter((p) => !seen.includes(p.href));
      if (!pool.length) {
        seen = [current];
        pool = all.filter((p) => p.href !== current);
      }
      try { sessionStorage.setItem("sf-seen-projects", JSON.stringify(seen)); } catch (e) {}

      const sameType = pool.filter((p) => p.type === me.type);
      const choices = sameType.length ? sameType : pool;
      return choices[Math.floor(Math.random() * choices.length)] || null;
    })
    .catch(() => null);
}

function nextProjectCard(project, href) {
  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  const card = make("a", "next-project");
  card.href = href;
  const img = make("img");
  img.src = project.img;
  img.alt = project.title;
  img.loading = "lazy";
  if (project.imgStyle) img.setAttribute("style", project.imgStyle);
  const label = make("div", "next-project-label");
  label.append(
    make("span", "next-project-eyebrow", "Next project"),
    make("h3", "", project.title),
    make("span", "next-project-kicker", project.kicker),
    make("span", "next-project-arrow", "View project \u2192")
  );
  card.append(img, label);
  return card;
}
