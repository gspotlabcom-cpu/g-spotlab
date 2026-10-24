/* Add a lightweight, accessible back-to-top control to long pages. */
(function () {
  if (document.querySelector(".gsl-back-to-top")) return;
  var button = document.createElement("button");
  button.type = "button";
  button.className = "gsl-back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.setAttribute("title", "Back to top");
  button.textContent = "↑";
  document.body.appendChild(button);
  function updateVisibility() {
    button.classList.toggle("is-visible", window.scrollY > 360);
  }
  button.addEventListener("click", function () {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  window.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();
})();
