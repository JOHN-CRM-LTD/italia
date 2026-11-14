/* Italia — Lume. The menu plate follows your reading. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header background once the page moves */
  var bar = document.getElementById("top-bar");
  function onScroll() { bar.classList.toggle("is-scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- menu: light the course being read and bring its plate to the table ---- */
  var courses = Array.prototype.slice.call(document.querySelectorAll(".course"));
  var img = document.getElementById("menu-plate-img");
  var current = null, swapTimer;
  function light(li) {
    if (li === current) return;
    if (current) current.classList.remove("is-lit");
    li.classList.add("is-lit");
    current = li;
    var src = "images/" + li.getAttribute("data-img");
    if (img.getAttribute("src") === src) return;
    clearTimeout(swapTimer);
    if (reduce) { img.src = src; return; }
    img.classList.add("is-swapping");
    swapTimer = setTimeout(function () {
      img.src = src;
      img.onload = function () { img.classList.remove("is-swapping"); };
      setTimeout(function () { img.classList.remove("is-swapping"); }, 400);
    }, 260);
  }
  if (courses.length) {
    light(courses[0]);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) light(e.target); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    courses.forEach(function (c) { io.observe(c); });
  }
})();
