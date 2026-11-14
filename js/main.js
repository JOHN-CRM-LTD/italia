/* Italia — Lume. The room lights when you arrive; the menu plate follows your reading. */
(function () {
  "use strict";
  window.__italia = true;

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  /* ---- split headings into words or letters so they can rise one by one ---- */
  function split(el) {
    var chars = el.getAttribute("data-split") === "chars";
    var text = el.textContent.replace(/\s+/g, " ").trim();
    var i = 0;
    function piece(str, cls) {
      var outer = document.createElement("span");
      var inner = document.createElement("span");
      outer.className = cls;
      outer.setAttribute("aria-hidden", "true");
      outer.style.setProperty("--i", i++);
      inner.textContent = str;
      outer.appendChild(inner);
      return outer;
    }
    el.setAttribute("aria-label", text);
    el.textContent = "";
    text.split(chars ? "" : " ").forEach(function (part, k) {
      if (!chars && k) el.appendChild(document.createTextNode(" "));
      el.appendChild(part === " " ? document.createTextNode(" ") : piece(part, chars ? "ch" : "w"));
    });
  }
  if (!reduce) $$("[data-split]").forEach(split);

  /* ---- header: tint once the page moves, step aside on the way down, return on the way up ---- */
  var bar = $("#top-bar");
  var lastY = window.scrollY;
  var menuOpen = false;
  function header(y) {
    bar.classList.toggle("is-scrolled", y > 40);
    if (Math.abs(y - lastY) < 6) return;
    bar.classList.toggle("is-hidden", y > lastY && y > 480 && !menuOpen);
    lastY = y;
  }

  /* ---- mobile menu ---- */
  var toggle = $(".menu-toggle");
  var sheet = $("#mobile-menu");
  var behind = [$("#main"), $(".foot")];
  function setMenu(open) {
    menuOpen = open;
    bar.classList.toggle("menu-open", open);
    sheet.classList.toggle("is-open", open);
    root.classList.toggle("is-locked", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    behind.forEach(function (el) {
      if (!el) return;
      if (open) el.setAttribute("inert", ""); else el.removeAttribute("inert");
    });
    if (open) bar.classList.remove("is-hidden");
  }
  if (toggle && sheet) {
    toggle.addEventListener("click", function () { setMenu(!menuOpen); });
    $$("a", sheet).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuOpen) { setMenu(false); toggle.focus(); }
    });
    var wide = window.matchMedia("(min-width: 901px)");
    var onWide = function (e) { if (e.matches && menuOpen) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", onWide); else wide.addListener(onWide);
  }

  /* ---- hero: light the room once the photograph is ready ---- */
  var hero = $(".hero");
  var heroImg = $(".hero-img");
  function heroReady() {
    if (!hero || hero.classList.contains("is-ready")) return;
    hero.classList.add("is-ready");
    setTimeout(function () { hero.classList.add("is-done"); }, 2400);
  }
  if (hero) {
    if (heroImg && !(heroImg.complete && heroImg.naturalWidth)) {
      heroImg.addEventListener("load", heroReady);
      heroImg.addEventListener("error", heroReady);
    } else {
      /* two frames, so the dark first state is painted before it lifts */
      requestAnimationFrame(function () { requestAnimationFrame(heroReady); });
    }
    setTimeout(heroReady, 2500);   /* never leave the room dark */
  }

  /* ---- reveal on scroll ---- */
  var revealEls = $$("[data-reveal]");
  if (reduce || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty("--d", (Math.min(n++, 6) * 0.09).toFixed(2) + "s");
        e.target.classList.add("is-in");
        revealer.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    revealEls.forEach(function (el) { revealer.observe(el); });
  }

  /* ---- menu: light the course being read and turn its plate onto the table ---- */
  var courses = $$(".course");
  var stage = $(".menu-stage");
  var plates = stage ? $$(".plate", stage) : [];
  var num = $("#menu-num");
  var current = null, front = 0, token = 0;

  function showPlate(src) {
    if (plates.length < 2) return;
    var my = ++token;
    var cur = plates[front], next = plates[1 - front];
    if (cur.getAttribute("src") === src) return;
    function swap() {
      if (my !== token) return;
      if (!reduce) {
        next.classList.add("is-pre");   /* start from the other side, so plates turn through in one direction */
        void next.offsetWidth;
        next.classList.remove("is-pre");
      }
      next.classList.add("is-on");
      cur.classList.remove("is-on");
      front = 1 - front;
    }
    next.src = src;
    if (next.decode) next.decode().then(swap, swap); else { next.onload = swap; }
  }

  function light(li) {
    if (li === current) return;
    if (current) current.classList.remove("is-lit");
    li.classList.add("is-lit");
    current = li;

    var idx = courses.indexOf(li);
    if (stage) stage.style.setProperty("--prog", ((idx + 1) / courses.length).toFixed(4));
    if (num) num.textContent = (idx < 9 ? "0" : "") + (idx + 1);

    showPlate("images/" + li.getAttribute("data-img"));
  }

  if (courses.length) {
    light(courses[0]);
    /* warm the cache so plates never arrive late */
    window.addEventListener("load", function () {
      courses.forEach(function (c) { new Image().src = "images/" + c.getAttribute("data-img"); });
    });
  }

  /* Which course is being read? While the plate is pinned, a reading line travels from the top of
     the pinned stage to its bottom as the list passes, and the course nearest the line is lit.
     Every course, the first and last included, has its turn while the plate is fully on screen.
     On phones (no pinned plate) the line is simply the middle of the screen. */
  var courseList = $(".courses");
  function readMenu(vh) {
    if (!courses.length || !courseList) return;
    var cr = courseList.getBoundingClientRect();
    if (cr.bottom < -vh || cr.top > vh * 2) return;
    var lineY = vh * 0.5;
    if (stage && stage.offsetParent) {
      var pinTop = parseFloat(getComputedStyle(stage).top) || 0;
      var sh = stage.offsetHeight;
      var p = clamp((pinTop - cr.top) / Math.max(1, cr.height - sh), 0, 1);
      var h0 = courses[0].offsetHeight, hN = courses[courses.length - 1].offsetHeight;
      lineY = pinTop + h0 / 2 + p * (sh - (h0 + hN) / 2);   /* centre of the first row at the start, of the last row at the end */
      if (!reduce) stage.style.setProperty("--rot", ((p - 0.5) * 48).toFixed(2) + "deg");
    }
    var pick = courses[0], best = Infinity;
    courses.forEach(function (c) {
      var r = c.getBoundingClientRect();
      var d = Math.abs(r.top + r.height / 2 - lineY);
      if (d < best) { best = d; pick = c; }
    });
    light(pick);
  }

  /* ---- nav: mark the section being read ---- */
  var navLinks = $$(".nav a");
  if (hasIO && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var link = $('.nav a[href="#' + e.target.id + '"]');
        if (!link) return;
        if (e.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    navLinks.forEach(function (a) {
      var target = $(a.getAttribute("href"));
      if (target) spy.observe(target);
    });
  }

  /* ---- scroll-linked movement: one rAF per scroll frame, transforms only ---- */
  var heroFrame = $(".hero-frame");
  var heroCopy = $(".hero-copy");
  var drifters = reduce ? [] : $$("[data-parallax]").map(function (el) {
    return { el: el, ref: el.parentElement, speed: parseFloat(el.getAttribute("data-parallax")) || 0.08, near: !hasIO };
  });
  if (hasIO && drifters.length) {
    var nearby = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        drifters.forEach(function (d) { if (d.ref === e.target) d.near = e.isIntersecting; });
      });
    }, { rootMargin: "25% 0px 25% 0px" });
    drifters.forEach(function (d) { nearby.observe(d.ref); });
  }

  /* ---- scrollbar: a thin gold thumb that shows while the page moves, then fades ---- */
  var track = $(".scrollbar");
  var thumb = track && $(".scrollbar-thumb", track);
  var placeBar = null, showBar = function () {};
  if (track && thumb) {
    root.classList.add("has-bar");
    var thumbH = 0, maxY = 0, hideTimer, drag = null;
    var range = function () { return Math.max(0, root.scrollHeight - window.innerHeight); };
    placeBar = function () {
      var r = range();
      var y = r > 0 ? (window.scrollY / r) * maxY : 0;
      thumb.style.transform = "translateY(" + clamp(y, 0, maxY).toFixed(1) + "px)";
    };
    var measureBar = function () {
      var vh = window.innerHeight, dh = root.scrollHeight;
      track.style.visibility = dh > vh + 1 ? "" : "hidden";
      thumbH = Math.max(48, vh * vh / dh);
      maxY = vh - thumbH;
      thumb.style.height = thumbH.toFixed(1) + "px";
      placeBar();
    };
    showBar = function () {
      track.classList.add("is-on");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { if (!drag) track.classList.remove("is-on"); }, 900);
    };
    /* drag the thumb like a native scrollbar */
    thumb.addEventListener("pointerdown", function (e) {
      drag = { y: e.clientY, s: window.scrollY };
      thumb.setPointerCapture(e.pointerId);
      track.classList.add("is-drag");
      root.style.scrollBehavior = "auto";
      e.preventDefault();
    });
    thumb.addEventListener("pointermove", function (e) {
      if (!drag) return;
      window.scrollTo(0, drag.s + (e.clientY - drag.y) * range() / Math.max(1, maxY));
    });
    var endDrag = function () {
      if (!drag) return;
      drag = null;
      track.classList.remove("is-drag");
      root.style.scrollBehavior = "";
      showBar();
    };
    thumb.addEventListener("pointerup", endDrag);
    thumb.addEventListener("pointercancel", endDrag);
    /* click the empty track to move a screen towards the click */
    track.addEventListener("pointerdown", function (e) {
      if (e.target !== track) return;
      var above = e.clientY < thumb.getBoundingClientRect().top;
      window.scrollBy({ top: (above ? -0.9 : 0.9) * window.innerHeight, behavior: reduce ? "auto" : "smooth" });
    });
    window.addEventListener("resize", measureBar);
    if ("ResizeObserver" in window) new ResizeObserver(measureBar).observe(document.body);
    measureBar();
  }

  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    header(y);
    readMenu(vh);
    if (placeBar) placeBar();
    if (reduce) return;

    if (hero && heroFrame) {
      var hh = hero.offsetHeight;
      if (y < hh) {
        heroFrame.style.setProperty("--py", (y * 0.24).toFixed(1) + "px");
        if (heroCopy) {
          heroCopy.style.setProperty("--fade", (1 - clamp(y / (hh * 0.62), 0, 1)).toFixed(3));
          heroCopy.style.setProperty("--lift", (y * -0.12).toFixed(1) + "px");
        }
      }
    }

    drifters.forEach(function (d) {
      if (!d.near) return;
      var r = d.ref.getBoundingClientRect();
      var shift = (r.top + r.height / 2 - vh / 2) * d.speed;
      var slack = (d.el.offsetHeight - r.height) / 2;   /* an image taller than its frame may only travel its overscan */
      if (slack > 0) shift = clamp(shift, -slack, slack);
      d.el.style.setProperty("--py", shift.toFixed(1) + "px");
    });
  }
  function requestFrame() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }
  window.addEventListener("scroll", function () { requestFrame(); showBar(); }, { passive: true });
  window.addEventListener("resize", requestFrame);
  frame();

  /* ---- music: off until asked for; the disc turns while it plays.
     The song runs to 1:49, fades over the last moment, and starts again. ---- */
  var audio = $("#theme");
  var sound = $(".sound");
  if (audio && sound) {
    var LOOP_AT = 109, FADE_OUT = 1.6, FADE_IN = 0.6, VOLUME = 0.6;
    var looping = false;
    var setUi = function (on) {
      sound.classList.toggle("is-playing", on);
      sound.setAttribute("aria-pressed", String(on));
      sound.setAttribute("aria-label", on ? "Pause music" : "Play music");
      sound.title = on ? "Pause music" : "Play music";
    };
    var restart = function () { audio.currentTime = 0; };
    var level = function () {
      var t = audio.currentTime;
      if (t >= LOOP_AT) { restart(); t = 0; }
      var v = VOLUME;
      if (t > LOOP_AT - FADE_OUT) v = VOLUME * (LOOP_AT - t) / FADE_OUT;
      else if (t < FADE_IN) v = VOLUME * (0.15 + 0.85 * t / FADE_IN);
      audio.volume = clamp(v, 0, 1);
    };
    var loop = function () {
      if (audio.paused) { looping = false; return; }
      level();
      requestAnimationFrame(loop);
    };
    audio.volume = VOLUME * 0.15;
    /* background tabs pause rAF, so keep the 1:49 loop on the media clock as well */
    audio.addEventListener("timeupdate", level);
    audio.addEventListener("ended", function () { restart(); audio.play(); });
    audio.addEventListener("play", function () {
      setUi(true);
      if (!looping) { looping = true; requestAnimationFrame(loop); }
    });
    audio.addEventListener("pause", function () { setUi(false); });
    sound.addEventListener("click", function () {
      if (audio.paused) {
        var p = audio.play();
        if (p && p.catch) p.catch(function () { setUi(false); });
      } else {
        audio.pause();
      }
    });
  }
})();
