/* =============================================
   COLABO — nav.js
   Sticky nav scroll effect (Made by Abdiel Diaz   )
   ============================================= */

(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const onScroll = () => {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); 
})();