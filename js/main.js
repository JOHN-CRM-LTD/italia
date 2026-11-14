/* Italia — Lume. The room lights when you arrive; the menu plate follows your reading. */
(function () {
  "use strict";
  window.__italia = true;

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
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
  var ghost = $("#menu-ghost");
  var num = $("#menu-num");
  var current = null, front = 0, token = 0, ghostTimer;

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

    var region = $(".region", li);
    if (ghost && region) {
      clearTimeout(ghostTimer);
      if (reduce) {
        ghost.textContent = region.textContent;
      } else {
        ghost.classList.add("is-out");
        ghostTimer = setTimeout(function () {
          ghost.textContent = region.textContent;
          ghost.classList.remove("is-out");
        }, 300);
      }
    }
    showPlate("images/" + li.getAttribute("data-img"));
  }

  if (courses.length) {
    light(courses[0]);
    if (hasIO) {
      var reader = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) light(e.target); });
      }, { rootMargin: "-45% 0px -50% 0px" });
      courses.forEach(function (c) { reader.observe(c); });
    }
    if (finePointer) courses.forEach(function (c) { c.addEventListener("mouseenter", function () { light(c); }); });
    /* warm the cache so plates never arrive late */
    window.addEventListener("load", function () {
      courses.forEach(function (c) { new Image().src = "images/" + c.getAttribute("data-img"); });
    });
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
  var courseList = $(".courses");
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

  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    header(y);
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

    if (stage && courseList && stage.offsetParent) {
      var cr = courseList.getBoundingClientRect();
      var p = clamp((vh * 0.5 - cr.top) / cr.height, 0, 1);
      stage.style.setProperty("--rot", ((p - 0.5) * 48).toFixed(2) + "deg");
    }
  }
  function requestFrame() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame);
  frame();

  /* ---- pointer candlelight: the one moving light ---- */
  var lume = $(".lume");
  if (lume && finePointer && !reduce) {
    var tx = 0, ty = 0, lx = 0, ly = 0, chasing = false, seen = false;
    var chase = function () {
      lx += (tx - lx) * 0.11;
      ly += (ty - ly) * 0.11;
      lume.style.transform = "translate3d(" + lx.toFixed(1) + "px," + ly.toFixed(1) + "px,0)";
      chasing = Math.abs(tx - lx) > 0.3 || Math.abs(ty - ly) > 0.3;
      if (chasing) requestAnimationFrame(chase);
    };
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY;
      if (!seen) { seen = true; lx = tx; ly = ty; }
      lume.classList.add("is-on");
      if (!chasing) { chasing = true; requestAnimationFrame(chase); }
    }, { passive: true });
    root.addEventListener("mouseleave", function () { lume.classList.remove("is-on"); });
  }
})();
