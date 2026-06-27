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
      "opens": "09:00",
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

  var faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What types of photography does Soul & Fuel offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Soul & Fuel specialises in interior & architecture photography, travel films, and corporate films. We work with residential, commercial, and hospitality clients across India."
        }
      },
      {
        "@type": "Question",
        "name": "Where is Soul & Fuel based?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Soul & Fuel is based in Bengaluru, Karnataka, India. We travel across India and abroad for the right project."
        }
      },
      {
        "@type": "Question",
        "name": "How can I hire Soul & Fuel for a shoot?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can reach out via email at mahesh@soulandfuel.com or call +91 7904999975. Tell us about the space, the trip, or the brand and roughly when you need it shot."
        }
      },
      {
        "@type": "Question",
        "name": "Which magazines have featured Soul & Fuel's work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Soul & Fuel's work has been featured in ELLE Decor India, Architect & Interiors India, Good Homes India, India Today Homes, New Indian Express, and Home Publication."
        }
      },
      {
        "@type": "Question",
        "name": "Does Soul & Fuel shoot outside Bangalore?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Soul & Fuel is available for shoots across India and internationally. Recent projects include work in Mumbai, Chikmagalur, and Coorg."
        }
      }
    ]
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

  inject(org);
  inject(website);
  if (document.querySelector(".cat-hero") || document.querySelector(".page-hero") || document.querySelector(".hero")) {
    inject(faq);
  }
})();
