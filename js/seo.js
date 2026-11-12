// Structured data for Soul & Fuel — injected on every page
(function () {
  var org = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.soulandfuel.com/#business",
    "name": "Soul & Fuel Media",
    "alternateName": "Soul and Fuel",
    "description": "Interior & architecture photography, travel films and corporate films studio based in Bengaluru, India. Serving residential, commercial and hospitality clients across India.",
    "url": "https://www.soulandfuel.com",
    "logo": "https://www.soulandfuel.com/images/logo/horizontal-black.png",
    "image": "https://www.soulandfuel.com/images/projects/tata-promont/dsc06603.jpg",
    "email": "mahesh@soulandfuel.com",
    "telephone": "+917904999975",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bengaluru",
      "addressRegion": "Karnataka",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "areaServed": [
      { "@type": "Country", "name": "India" },
      { "@type": "City", "name": "Bengaluru" },
      { "@type": "City", "name": "Mumbai" }
    ],
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "09:30",
      "closes": "19:00"
    },
    "sameAs": [
      "https://instagram.com/soulandfuel_media",
      "https://instagram.com/soulandfuel",
      "https://www.youtube.com/@SoulandFuel",
      "https://in.linkedin.com/in/mahesh91"
    ],
    "founder": {
      "@type": "Person",
      "name": "Mahesh",
      "jobTitle": "Photographer & Filmmaker",
      "url": "https://in.linkedin.com/in/mahesh91"
    },
    "knowsAbout": [
      "Interior Photography",
      "Architecture Photography",
      "Travel Filmmaking",
      "Corporate Films",
      "Real Estate Photography",
      "Hospitality Photography"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Photography & Film Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Interior & Architecture Photography",
            "description": "Professional interior and architecture photography for residences, commercial spaces, hospitality and studios across India."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Travel Films",
            "description": "Short travel films for tourism boards, hospitality brands and personal projects."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Corporate Films",
            "description": "Brand films, founder stories and internal communications for corporate clients."
          }
        }
      ]
    }
  };

  var website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Soul & Fuel Media",
    "url": "https://www.soulandfuel.com"
  };

  function inject(data) {
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  // Index, About and Contact already carry the full business block in their HTML.
  // Skip it there so search engines don't see two copies of the same business.
  var hasStatic = Array.prototype.some.call(
    document.querySelectorAll('script[type="application/ld+json"]'),
    function (el) { return el.textContent.indexOf('openingHoursSpecification') !== -1; }
  );
  if (!hasStatic) inject(org);
  inject(website);
  // The FAQ now lives as a visible section on about.html, with its own markup there.
})();
