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
});
