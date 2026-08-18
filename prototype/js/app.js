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
    /* The contract subnav scrolls — bring the active pill into view, otherwise
       the last tabs sit off-screen on load. */
    if (current) {
      var subnav = current.querySelector(".subnav");
      var active = subnav && subnav.querySelector('[aria-current="true"]');
      if (active) subnav.scrollLeft = Math.max(0, active.offsetLeft - 16);
    }

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
    var g = e.target.closest("[data-goto]");
    if (g) {
      location.hash = "#/" + g.dataset.goto;
      return;
    }
    if (e.target.closest("[data-stop]")) return;
  });

  /* keyboard access for the role="button" blocks */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (!e.target.closest) return;
    var g = e.target.closest('[data-goto][role="button"]');
    if (g) {
      e.preventDefault();
      location.hash = "#/" + g.dataset.goto;
      return;
    }
    var s = e.target.closest('[data-open-sheet][role="button"]');
    if (s) {
      e.preventDefault();
      s.click();
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

  /* "Zobrazit ukončené" switches the Můj svět body between the active contracts
     and the archive — the two are never on screen at the same time. */
  document.querySelectorAll("[data-toggle-ended]").forEach(function (btn) {
    var screen = btn.closest(".screen");
    var ended = document.getElementById(btn.getAttribute("aria-controls"));
    if (!screen || !ended) return;
    var active = Array.prototype.filter.call(
      screen.querySelectorAll(".section"),
      function (s) {
        return s !== ended;
      }
    );
    btn.addEventListener("click", function () {
      var showEnded = ended.hidden;
      ended.hidden = !showEnded;
      active.forEach(function (s) {
        s.hidden = showEnded;
      });
      btn.setAttribute("aria-expanded", String(showEnded));
      btn.textContent = showEnded ? "Zobrazit aktivní" : "Zobrazit ukončené";
      screen.scrollTop = 0;
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

  /* "Zobrazit více / méně" folds the tail of a bullet list inside a card. */
  document.querySelectorAll("[data-expand]").forEach(function (box) {
    var btn = box.querySelector(".expandbtn");
    var label = btn && btn.querySelector("span");
    if (!label) return;
    btn.addEventListener("click", function () {
      box.classList.toggle("is-open");
      label.textContent = box.classList.contains("is-open")
        ? "Zobrazit méně"
        : "Zobrazit více";
    });
  });

  /* Collapsible section header (archiv dokumentů) — the chevron flips via CSS. */
  document.querySelectorAll("[data-toggle-section]").forEach(function (btn) {
    var body = document.getElementById(btn.getAttribute("aria-controls"));
    if (!body) return;
    btn.addEventListener("click", function () {
      body.hidden = !body.hidden;
      btn.setAttribute("aria-expanded", String(!body.hidden));
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
      /* Same [data-stop] contract as data-goto: a stopper sitting between the
         click and the opener means the click belongs to the nested control. */
      var stop = e.target.closest("[data-stop]");
      if (stop && stop !== opener && opener.contains(stop)) return;
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

  /* Property reviews. The prototype keeps the data deliberately local: the
     production source will be DS, while this makes every state and form flow
     clickable without inventing an API. */
  var reviewState = { boiler: "empty", chimney: "locked", extinguisher: "empty" };
  var activeReview = null;
  var reviewNames = { boiler: "zdroje vytápění", chimney: "komína", extinguisher: "hasicího přístroje" };
  var reviewTitles = { boiler: "Kotel / zdroj vytápění", chimney: "Komín (spalinová cesta)", extinguisher: "Hasicí přístroje" };

  function reviewMarkup(key, state) {
    var title = reviewTitles[key];
    var icon = '<svg aria-hidden="true"><use href="#ic-card" /></svg>';
    if (state === "locked") return '<div class="reviewcard__head">' + icon + '<div><h2 class="reviewcard__title">' + title + '</h2><p class="reviewcard__sub">Nejdřív zadejte kotel</p></div></div><div class="reviewcard__body"><p class="emptybody__text">Podle zdroje vytápění nastavíme správné lhůty pro komín.</p><button class="btn btn--secondary" type="button" data-review-action="setup" data-review="boiler">Zadat kotel</button></div>';
    if (state === "empty") return '<div class="reviewcard__head">' + icon + '<div><h2 class="reviewcard__title">' + title + '</h2><p class="reviewcard__sub">neuvedeno</p></div></div><div class="reviewcard__body"><p class="emptybody__text">Zadejte datum poslední revize. Pohlídáme termín té příští.</p><button class="btn btn--secondary" type="button" data-review-action="setup" data-review="' + key + '">Nastavit</button></div>';
    var warn = state === "warn";
    var danger = state === "danger";
    var remaining = danger ? "Překročeno o 2 měsíce" : warn ? "Zbývá 3 měsíce" : "Zbývá 8 měsíců";
    var message = danger ? "Termín revize už uplynul." : warn ? "Čas se krátí" : "Včas se vám připomeneme";
    return '<div class="reviewcard__head">' + icon + '<div><h2 class="reviewcard__title">' + title + '</h2><p class="reviewcard__sub">Sledujeme</p></div></div><div class="reviewcard__body"><div class="reviewcard__meta"><span>Další revize</span><b>' + (danger ? "17. 6. 2026" : warn ? "17. 11. 2026" : "17. 4. 2027") + '</b></div>' + (key === "chimney" ? '<div class="reviewcard__meta"><span>Čištění</span><b>1× ročně</b></div>' : '') + '<div class="reviewcard__banner">' + message + ' · ' + remaining + '</div><button class="btn ' + (danger ? 'btn--outline-danger' : warn ? 'btn--warning' : 'btn--secondary') + '" type="button" data-review-action="record" data-review="' + key + '">Zaznamenat revizi</button><button class="linkbtn" type="button" data-review-action="stop" data-review="' + key + '">Přestat sledovat revize</button></div>';
  }
  function renderReviews() {
    document.querySelectorAll(".reviewcard[data-review]").forEach(function (card) {
      var key = card.dataset.review;
      if (!reviewState[key]) return;
      card.hidden = reviewState[key] === "none";
      if (card.hidden) return;
      card.className = "reviewcard reviewcard--" + reviewState[key];
      card.innerHTML = reviewMarkup(key, reviewState[key]);
    });
  }
  function openReviewSheet(key, recording) {
    activeReview = key;
    var sheet = document.getElementById("sheet-review");
    var boilerFields = sheet.querySelector("[data-review-boiler-fields]");
    sheet.querySelector("#sh-review").textContent = recording ? "Zaznamenat revizi" : "Nastavit revizi";
    sheet.querySelector("[data-review-sheet-sub]").textContent = recording ? "Datum revize přepočítá příští termín." : "Zadejte datum poslední revize. Pohlídáme termín té příští.";
    boilerFields.hidden = key !== "boiler";
    sheet.querySelector("[data-save-review]").textContent = recording ? "Zaznamenat revizi" : "Začít sledovat";
    sheet.classList.add("is-open");
  }
  document.addEventListener("click", function (e) {
    var action = e.target.closest("[data-review-action]");
    if (action) {
      var key = action.dataset.review;
      if (action.dataset.reviewAction === "stop") { activeReview = key; document.getElementById("sheet-review-stop").classList.add("is-open"); }
      else openReviewSheet(key, action.dataset.reviewAction === "record");
      return;
    }
    if (e.target.closest("[data-save-review]")) {
      if (!activeReview) return;
      var entered = document.getElementById("review-date").value;
      var reviewDate = entered ? new Date(entered + "T12:00:00") : new Date();
      var next = new Date(reviewDate);
      next.setFullYear(next.getFullYear() + 1);
      var ratio = (next - new Date()) / (365.25 * 24 * 60 * 60 * 1000);
      reviewState[activeReview] = ratio <= 0.15 ? "danger" : ratio <= 0.4 ? "warn" : "green";
      if (activeReview === "boiler") {
        var source = document.getElementById("heat-source").value;
        reviewState.chimney = /Elektrický|Tepelné|Dálkové/.test(source) ? "none" : "empty";
      }
      closeSheets(); renderReviews(); showReviewToast("Začali jsme sledovat revize " + reviewNames[activeReview] + ".");
      return;
    }
    if (e.target.closest("[data-confirm-stop]")) {
      reviewState[activeReview] = "empty";
      if (activeReview === "boiler") reviewState.chimney = "locked";
      closeSheets(); renderReviews(); showReviewToast("Připomínky jsme vypnuli.");
    }
  });
  function showReviewToast(message) {
    var toast = document.querySelector("[data-review-toast]");
    if (!toast) return;
    toast.textContent = message; toast.hidden = false;
    window.setTimeout(function () { toast.hidden = true; }, 3200);
  }
  renderReviews();

  /* Live clock in the fake iOS status bar */
  var clock = document.getElementById("clock");
  function tick() {
    var d = new Date();
    clock.textContent = d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  tick();
  setInterval(tick, 20000);
})();
