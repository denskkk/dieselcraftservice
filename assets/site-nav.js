(() => {
  if (window.__dieselCraftSiteNavReady) return;
  window.__dieselCraftSiteNavReady = true;

  const init = () => {
    const header = document.getElementById('main-header');
    const burger = document.getElementById('burger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileServicesBtn = document.getElementById('mob-services-btn');
    const mobileServicesPanel = document.getElementById('mob-services-panel');

    if (header) {
      const syncHeader = () => header.classList.toggle('scrolled', window.scrollY > 60);
      syncHeader();
      window.addEventListener('scroll', syncHeader, { passive: true });
    }

    const toggleMenu = (force) => {
      if (!burger || !mobileMenu) return;
      const open = typeof force === 'boolean' ? force : !mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', open);
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };

    burger?.addEventListener('click', () => toggleMenu());
    document.querySelectorAll('[data-close-menu]').forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    mobileServicesBtn?.addEventListener('click', () => {
      if (!mobileServicesPanel) return;
      const open = !mobileServicesPanel.classList.contains('open');
      mobileServicesPanel.classList.toggle('open', open);
      mobileServicesBtn.setAttribute('aria-expanded', String(open));
    });

    document.querySelectorAll('.dropdown-group').forEach((group) => {
      const trigger = group.querySelector('.nav-dropdown-trigger');
      trigger?.addEventListener('click', (event) => {
        event.preventDefault();
        const open = group.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(open));
      });
    });

    document.addEventListener('click', (event) => {
      document.querySelectorAll('.dropdown-group.open').forEach((group) => {
        if (!group.contains(event.target)) {
          group.classList.remove('open');
          group.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
