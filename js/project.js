// Renders a single project's hero + full masonry photo grid on project.html,
// based on the ?slug= in the URL and the data in js/projects-data.js

document.addEventListener("DOMContentLoaded", () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  const project = (window.PROJECTS || []).find((p) => p.slug === slug);

  const heroEl = document.getElementById("projectHero");
  const gridEl = document.getElementById("projectGrid");

  if (!project) {
    heroEl.innerHTML =
      '<a class="back-link" href="work-interior-architecture.html">&larr; All projects</a>' +
      "<h1>We couldn't find that project.</h1>" +
      '<p class="dek">It may have been renamed or removed. <a href="work-interior-architecture.html">Browse all projects &rarr;</a></p>';
    return;
  }

  document.title = project.title + " — Soul & Fuel Media";

  heroEl.innerHTML =
    '<a class="back-link" href="work-interior-architecture.html">&larr; All projects</a>' +
    '<span class="eyebrow">' +
    project.category +
    " &middot; " +
    project.location +
    " &middot; " +
    project.year +
    "</span>" +
    "<h1>" +
    project.title +
    "</h1>";

  gridEl.innerHTML = project.photos
    .map(function (p) {
      return (
        '<div class="ph reveal' +
        (p.tall ? " tall" : "") +
        '"><img src="' +
        p.src +
        '" alt="' +
        project.title +
        ' — photograph" loading="lazy"></div>'
      );
    })
    .join("");

  // Re-run the reveal-on-scroll observer for the freshly-injected grid items
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    gridEl.querySelectorAll(".reveal").forEach((t) => io.observe(t));
  } else {
    gridEl.querySelectorAll(".reveal").forEach((t) => t.classList.add("is-visible"));
  }
});
