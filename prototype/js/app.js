/* Hash-based tab routing. #/domu, #/muj-svet, #/pridat, #/pomoc, #/vice */

(function () {
  var DEFAULT_TAB = "domu";

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var screens = Array.prototype.slice.call(document.querySelectorAll(".screen"));
  var known = screens.map(function (s) {
    return s.dataset.screen;
  });

  function tabFromHash() {
    var id = (location.hash || "").replace(/^#\/?/, "");
    return known.indexOf(id) !== -1 ? id : DEFAULT_TAB;
  }

  function render(id) {
    var current = null;
    screens.forEach(function (s) {
      var active = s.dataset.screen === id;
      s.classList.toggle("is-active", active);
      if (active) {
        current = s;
        s.scrollTop = 0;
      }
    });
    /* Detail screens (no tab of their own) keep their parent tab highlighted. */
    var highlight = (current && current.dataset.tabParent) || id;
    tabs.forEach(function (t) {
      if (t.dataset.tab === highlight) {
        t.setAttribute("aria-current", "page");
      } else {
        t.removeAttribute("aria-current");
      }
    });
    document.title = "Direct — " + id;
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var id = t.dataset.tab;
      if (tabFromHash() === id) {
        render(id); // re-tap on the active tab scrolls back to top
        return;
      }
      location.hash = "#/" + id;
    });
  });

  window.addEventListener("hashchange", function () {
    render(tabFromHash());
  });

  render(tabFromHash());

  /* [data-goto="screen"] opens another screen; [data-stop] blocks the bubble so
     buttons nested inside a tappable block keep their own behaviour.
     [data-back] walks the history back. */
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-back]")) {
      history.back();
      return;
    }
    if (e.target.closest("[data-stop]")) return;
    var g = e.target.closest("[data-goto]");
    if (g) location.hash = "#/" + g.dataset.goto;
  });

  /* keyboard access for the role="button" blocks */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var g = e.target.closest && e.target.closest('[data-goto][role="button"]');
    if (g) {
      e.preventDefault();
      location.hash = "#/" + g.dataset.goto;
    }
  });

  /* Carousel dots: match the real slide count and follow the scroll position.
     A .dots element right after an .hscroll is treated as its indicator. */
  document.querySelectorAll(".hscroll").forEach(function (box) {
    var dots = box.nextElementSibling;
    if (!dots || !dots.classList.contains("dots")) return;
    var slides = box.querySelector(".hscroll__track").children;

    dots.innerHTML = "";
    for (var i = 0; i < slides.length; i++) dots.appendChild(document.createElement("i"));
    dots.children[0].classList.add("is-active");

    box.addEventListener(
      "scroll",
      function () {
        var step = box.scrollWidth / slides.length;
        var idx = Math.min(slides.length - 1, Math.round(box.scrollLeft / step));
        for (var j = 0; j < dots.children.length; j++) {
          dots.children[j].classList.toggle("is-active", j === idx);
        }
      },
      { passive: true }
    );
  });

  /* The smiley button in the detail bar shows/hides the state switcher. */
  document.querySelectorAll("[data-toggle-proto]").forEach(function (btn) {
    var bar = btn.closest(".screen").querySelector(".protobar");
    if (!bar) return;
    btn.addEventListener("click", function () {
      bar.hidden = !bar.hidden;
      btn.setAttribute("aria-pressed", String(!bar.hidden));
    });
  });

  /* Prototype state switcher: a .protobar row flips the variants inside the
     matching .vgroup (all variants live in the DOM, hidden via [hidden]). */
  document.querySelectorAll(".protobar__row[data-vgroup]").forEach(function (row) {
    var group = document.querySelector('.vgroup[data-group="' + row.dataset.vgroup + '"]');
    if (!group) return;
    row.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-variant]");
      if (!btn) return;
      row.querySelectorAll("button").forEach(function (b) {
        b.removeAttribute("aria-current");
      });
      btn.setAttribute("aria-current", "true");
      group.querySelectorAll("[data-variant]").forEach(function (el) {
        el.hidden = el.dataset.variant !== btn.dataset.variant;
      });
    });
  });

  /* Letní / Zimní pill toggles */
  document.querySelectorAll("[data-pilltoggle]").forEach(function (grp) {
    grp.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      grp.querySelectorAll("button").forEach(function (b) {
        b.removeAttribute("aria-current");
      });
      btn.setAttribute("aria-current", "true");
    });
  });

  /* Odometer stepper inside the updateKm sheet */
  document.querySelectorAll("[data-step]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = btn.closest(".stepper").querySelector("[data-km]");
      var n = parseInt(input.value.replace(/\D/g, ""), 10) || 0;
      n = Math.max(0, n + parseInt(btn.dataset.step, 10));
      input.value = n.toLocaleString("cs-CZ").replace(/ /g, " ") + " km";
    });
  });

  /* Bottom sheets: [data-open-sheet="id"] opens #sheet-id, [data-close-sheet] closes. */
  function closeSheets() {
    document.querySelectorAll(".sheet.is-open").forEach(function (s) {
      s.classList.remove("is-open");
    });
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open-sheet]");
    if (opener) {
      var sheet = document.getElementById("sheet-" + opener.dataset.openSheet);
      if (sheet) sheet.classList.add("is-open");
      return;
    }
    if (e.target.closest("[data-close-sheet]")) closeSheets();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSheets();
  });

  window.addEventListener("hashchange", closeSheets);

  /* Live clock in the fake iOS status bar */
  var clock = document.getElementById("clock");
  function tick() {
    var d = new Date();
    clock.textContent = d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  tick();
  setInterval(tick, 20000);
})();
