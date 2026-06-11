/* FeedForward — scroll reveal + animated counters.
   Robustness rule: opacity is NEVER touched, so content can never get
   stuck invisible (a paused animation clock would freeze an opacity fade
   at 0). We animate transform only — worst case, content sits a few px
   low until the clock runs or the 3s failsafe clears it. Counters seed
   their final value immediately and only count-up as an enhancement. */
(function () {
  function fmt(n) { return Math.round(n).toLocaleString(); }

  window.__ffReveal = function () {
    var els, counters;
    try {
      els = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
      counters = Array.prototype.slice.call(document.querySelectorAll("[data-count-to]"));
    } catch (e) { return; }

    function animateCount(el) {
      if (el.__counted) return;
      el.__counted = true;
      var target = parseFloat(el.getAttribute("data-count-to") || "0");
      el.textContent = fmt(target); // final value first — safe if the clock freezes
      var dur = 1500, start = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(e * target);
        if (t < 1) requestAnimationFrame(step);
      })(start);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
      return; // content already visible; skip motion
    }

    // Transform-only entrance. Opacity stays 1 throughout.
    els.forEach(function (el) {
      el.style.transform = "translateY(22px)";
      el.style.transition = "transform .7s cubic-bezier(.16,.84,.44,1)";
      el.style.willChange = "transform";
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var d = parseInt(en.target.getAttribute("data-reveal-delay") || "0", 10);
          en.target.style.transitionDelay = d + "ms";
          en.target.style.transform = "none";
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });

    // Fail-safe: settle everything after 3s no matter what.
    setTimeout(function () {
      els.forEach(function (el) { el.style.transform = "none"; });
      counters.forEach(animateCount);
    }, 3000);
  };
})();
