(() => {
  if (window.__dieselCraftAddressPhoneReady) return;
  window.__dieselCraftAddressPhoneReady = true;

  const storageKey = 'dieselCraftSelectedAddress';
  const phones = {
    address1: {
      tel: '+380933838363',
      label: '+380 93 383 83 63',
    },
  };

  const addresses = {
    address1: {
      title: 'Приміська, 1',
      subtitle: 'Основний сервіс DIESEL-CRAFT',
      mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=46.45079359464247%2C30.704746292629284',
    },
  };

  const getAddressId = (href) => {
    if (!href) return '';
    try {
      const hash = new URL(href, window.location.href).hash.replace('#', '');
      return phones[hash] ? hash : '';
    } catch {
      const match = href.match(/#(address[12])$/);
      return match ? match[1] : '';
    }
  };

  const readSavedAddress = () => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return phones[saved] ? saved : '';
    } catch {
      return '';
    }
  };

  const saveAddress = (addressId) => {
    try {
      window.localStorage.setItem(storageKey, addressId);
    } catch {
      // Ignore storage restrictions on local file previews.
    }
  };

  const syncPhoneLink = (link, phone) => {
    link.setAttribute('href', `tel:${phone.tel}`);
    if (link.classList.contains('dc-mobile-action-call')) {
      const label = link.querySelector('small');
      if (label) label.textContent = phone.label;
    }
  };

  const syncAddressOptions = (addressId) => {
    document.querySelectorAll('.address-option').forEach((option) => {
      const optionAddressId = getAddressId(option.getAttribute('href'));
      if (!optionAddressId) return;
      const selected = optionAddressId === addressId;
      option.classList.toggle('selected', selected);
      option.setAttribute('aria-selected', String(selected));
      const dot = option.querySelector('.dot');
      if (dot) {
        dot.style.cssText = selected
          ? 'background:#C1121F;box-shadow:0 0 6px rgba(193,18,31,0.6);'
          : 'background:#4b5563;box-shadow:none;';
      }
    });
  };

  const closeAddressDropdowns = () => {
    document.querySelectorAll('.address-dropdown.open').forEach((dropdown) => {
      dropdown.classList.remove('open');
      dropdown.querySelector('.address-btn')?.setAttribute('aria-expanded', 'false');
    });
  };

  const getLeadClickData = (link) => {
    const rawHref = link.getAttribute('href') || '';
    const href = rawHref.trim();
    if (!href) return null;

    const normalizedHref = href.toLowerCase();
    if (normalizedHref.startsWith('tel:')) {
      return {
        event: 'click_phone',
        contact_channel: 'phone',
        contact_value: href.replace(/^tel:/i, ''),
      };
    }

    if (normalizedHref.startsWith('viber:')) {
      return {
        event: 'click_viber',
        contact_channel: 'viber',
      };
    }

    try {
      const url = new URL(href, window.location.href);
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 't.me' || normalizedHref.startsWith('tg:')) {
        return {
          event: 'click_telegram',
          contact_channel: 'telegram',
        };
      }
      if (host === 'wa.me' || host === 'api.whatsapp.com') {
        return {
          event: 'click_whatsapp',
          contact_channel: 'whatsapp',
        };
      }
      if ((host === 'google.com' || host === 'maps.google.com') && normalizedHref.includes('maps')) {
        return {
          event: 'click_map',
          contact_channel: 'map',
        };
      }
    } catch {
      return null;
    }

    return null;
  };

  const pushLeadClickEvent = (link, clickData) => {
    try {
      window.dataLayer = window.dataLayer || [];
      const urlParams = new URLSearchParams(window.location.search);
      const ctaLocation = link.closest('.dc-mobile-actions')
        ? 'mobile_sticky'
        : link.closest('#main-header')
          ? 'header'
          : link.closest('.hero-section, .page-hero')
            ? 'hero'
            : link.closest('.callcta-section, .services-cta, .engine-cta')
              ? 'section_cta'
              : 'content';
      const deviceType = window.matchMedia('(max-width: 767px)').matches
        ? 'mobile'
        : window.matchMedia('(max-width: 1024px)').matches
          ? 'tablet'
          : 'desktop';
      window.dataLayer.push({
        ...clickData,
        phone_number: clickData.contact_channel === 'phone' ? clickData.contact_value : undefined,
        cta_location: ctaLocation,
        device_type: deviceType,
        landing_page: window.location.pathname,
        gclid: urlParams.get('gclid') || undefined,
        utm_source: urlParams.get('utm_source') || undefined,
        utm_campaign: urlParams.get('utm_campaign') || undefined,
        link_url: link.href || link.getAttribute('href') || '',
        link_text: link.textContent.trim().replace(/\s+/g, ' ').slice(0, 120),
        page_path: window.location.pathname,
        page_title: document.title,
      });
    } catch {
      // Analytics failures must never interfere with native link behavior.
    }
  };

  const trackLeadClick = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest('a[href]');
    if (!link) return;
    const clickData = getLeadClickData(link);
    if (clickData) pushLeadClickEvent(link, clickData);
  };

  const setAddress = (addressId, persist = true) => {
    const selectedAddress = phones[addressId] ? addressId : 'address1';
    const phone = phones[selectedAddress];
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => syncPhoneLink(link, phone));
    syncAddressOptions(selectedAddress);
    if (persist) saveAddress(selectedAddress);
  };

  const initEngineMenuCollapse = () => {
    document.querySelectorAll('.engine-menu-panel').forEach((panel, index) => {
      if (panel.dataset.engineCollapseReady === 'true') return;
      const head = panel.querySelector('.engine-menu-head');
      const grid = panel.querySelector('.engine-menu-grid');
      const footer = panel.querySelector('.engine-menu-footer');
      if (!head || !grid) return;

      panel.dataset.engineCollapseReady = 'true';
      const contentId = `engine-menu-content-${index + 1}`;
      grid.id = grid.id || contentId;
      if (footer) footer.id = footer.id || `${contentId}-footer`;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'engine-menu-collapse';
      panel.classList.add('is-collapsed');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', footer ? `${grid.id} ${footer.id}` : grid.id);
      button.innerHTML = '<span>Розгорнути</span><svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 8L6 4L10 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      head.appendChild(button);

      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const collapsed = panel.classList.toggle('is-collapsed');
        button.setAttribute('aria-expanded', String(!collapsed));
        button.querySelector('span').textContent = collapsed ? 'Розгорнути' : 'Згорнути';
      });
    });
  };

  const getPartnersHref = (nav) => {
    const contactsLink = nav.querySelector('a[href$="contacts.html"], a[href*="contacts.html#"]');
    const contactsHref = contactsLink?.getAttribute('href') || '';
    if (contactsHref) return contactsHref.replace(/contacts\.html.*/, 'partners.html');

    const path = window.location.pathname.replace(/\\/g, '/');
    if (path.includes('/poslugy/dvyguny/')) return '../../partners.html';
    if (path.includes('/poslugy/')) return '../partners.html';
    return 'partners.html';
  };

  const initPartnersNavLink = () => {
    document.querySelectorAll('.desktop-nav').forEach((nav) => {
      if (nav.querySelector('a[href$="partners.html"]')) return;
      const contactsLink = Array.from(nav.querySelectorAll('a.nav-link')).find((link) => (link.getAttribute('href') || '').includes('contacts.html'));
      if (!contactsLink) return;

      const partnersLink = document.createElement('a');
      partnersLink.href = getPartnersHref(nav);
      partnersLink.className = 'nav-link dc-partners-nav-link';
      partnersLink.textContent = 'Партнерам';
      nav.insertBefore(partnersLink, contactsLink);
    });

    document.querySelectorAll('#mobile-menu nav, .dc-site-mobile-menu nav').forEach((nav) => {
      if (nav.querySelector('a[href$="partners.html"]')) return;
      const contactsLink = Array.from(nav.querySelectorAll('a.mobile-nav-link')).find((link) => (link.getAttribute('href') || '').includes('contacts.html'));
      if (!contactsLink) return;

      const partnersLink = document.createElement('a');
      partnersLink.href = getPartnersHref(nav);
      partnersLink.className = 'mobile-nav-link dc-partners-nav-link';
      partnersLink.setAttribute('data-close-menu', '');
      partnersLink.textContent = 'Партнерам';
      nav.insertBefore(partnersLink, contactsLink);
    });
  };

  const initMobileFloatingActions = () => {
    if (document.querySelector('.dc-mobile-actions')) return;

    const bar = document.createElement('div');
    bar.className = 'dc-mobile-actions';
    bar.setAttribute('aria-label', 'Швидкі дії DIESEL-CRAFT');
    bar.innerHTML = `
      <div class="dc-mobile-actions-shell">
        <a href="tel:${phones.address1.tel}" class="dc-mobile-action-call" aria-label="Подзвонити в DIESEL-CRAFT">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.09 2.19 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span><strong>Зателефонувати</strong><small>${phones.address1.label}</small></span>
        </a>
        <a href="https://wa.me/${phones.address1.tel.replace('+', '')}" target="_blank" rel="noopener noreferrer" class="dc-mobile-action-message" aria-label="Написати DIESEL-CRAFT у WhatsApp">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a8 8 0 01-11.78 7.05L4 20l1.45-4.12A8 8 0 1120 11.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
          <span><strong>Написати</strong><small>WhatsApp</small></span>
        </a>
      </div>
    `;
    document.body.appendChild(bar);

    const syncVisibility = () => {
      const menuIsOpen = Boolean(document.querySelector('#mobile-menu.open, .dc-site-mobile-menu.open'));
      const activeElement = document.activeElement;
      const formIsActive = activeElement instanceof Element && Boolean(activeElement.closest('form'));
      bar.classList.toggle('is-hidden', menuIsOpen || formIsActive);
    };

    document.querySelectorAll('#mobile-menu, .dc-site-mobile-menu').forEach((menu) => {
      new MutationObserver(syncVisibility).observe(menu, {
        attributes: true,
        attributeFilter: ['class'],
      });
    });
    document.addEventListener('focusin', syncVisibility);
    document.addEventListener('focusout', () => requestAnimationFrame(syncVisibility));
    syncVisibility();
  };

  const init = () => {
    initPartnersNavLink();
    initMobileFloatingActions();
    const hashAddress = getAddressId(window.location.hash);
    setAddress(hashAddress || readSavedAddress() || 'address1', false);
    initEngineMenuCollapse();

    document.querySelectorAll('.address-dropdown').forEach((dropdown) => {
      const button = dropdown.querySelector('.address-btn');
      button?.addEventListener('click', (event) => {
        event.stopPropagation();
        const willOpen = !dropdown.classList.contains('open');
        closeAddressDropdowns();
        dropdown.classList.toggle('open', willOpen);
        button.setAttribute('aria-expanded', String(willOpen));
      });

      dropdown.querySelector('.address-menu')?.addEventListener('click', (event) => {
        event.stopPropagation();
      });
    });

    document.addEventListener('click', closeAddressDropdowns);
    document.addEventListener('click', trackLeadClick, { capture: true, passive: true });

    document.querySelectorAll('.address-option').forEach((option) => {
      option.addEventListener('click', () => {
        const addressId = getAddressId(option.getAttribute('href'));
        if (addressId) {
          setAddress(addressId);
          closeAddressDropdowns();
        }
      }, { capture: true });
    });

    window.addEventListener('hashchange', () => {
      const addressId = getAddressId(window.location.hash);
      if (addressId) setAddress(addressId);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();