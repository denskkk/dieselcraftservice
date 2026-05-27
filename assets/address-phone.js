(() => {
  if (window.__dieselCraftAddressPhoneReady) return;
  window.__dieselCraftAddressPhoneReady = true;

  const storageKey = 'dieselCraftSelectedAddress';
  const phones = {
    address1: {
      tel: '+380933838363',
      label: '+380 93 383 83 63',
    },
    address2: {
      tel: '+380933838373',
      label: '+380 93 383 83 73',
    },
  };

  const addresses = {
    address1: {
      title: 'Приміська, 1',
      subtitle: 'Основний сервіс DIESEL-CRAFT',
      mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=%D0%9F%D1%80%D0%B8%D0%BC%D1%96%D1%81%D1%8C%D0%BA%D0%B0%201%2C%20%D0%9E%D0%B4%D0%B5%D1%81%D0%B0',
    },
    address2: {
      title: 'Ак. Заболотного, 47',
      subtitle: 'Другий сервіс DIESEL-CRAFT',
      mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=%D0%90%D0%BA%D0%B0%D0%B4%D0%B5%D0%BC%D1%96%D0%BA%D0%B0%20%D0%97%D0%B0%D0%B1%D0%BE%D0%BB%D0%BE%D1%82%D0%BD%D0%BE%D0%B3%D0%BE%2047%2C%20%D0%9E%D0%B4%D0%B5%D1%81%D0%B0',
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
    const textNode = Array.from(link.childNodes).find((node) => (
      node.nodeType === Node.TEXT_NODE && node.textContent.includes('+380')
    ));
    if (textNode) textNode.textContent = phone.label;
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
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      ...clickData,
      link_url: link.href || link.getAttribute('href') || '',
      link_text: link.textContent.trim().replace(/\s+/g, ' ').slice(0, 120),
      page_path: window.location.pathname,
      page_title: document.title,
    });
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
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('aria-controls', footer ? `${grid.id} ${footer.id}` : grid.id);
      button.innerHTML = '<span>Згорнути</span><svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 8L6 4L10 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
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

  const closeMobileRoutePicker = () => {
    const bar = document.querySelector('.dc-mobile-actions');
    if (!bar) return;
    bar.classList.remove('is-route-open');
    bar.querySelector('.dc-mobile-route-toggle')?.setAttribute('aria-expanded', 'false');
    bar.querySelector('.dc-mobile-route-sheet')?.setAttribute('aria-hidden', 'true');
  };

  const initMobileFloatingActions = () => {
    if (document.querySelector('.dc-mobile-actions')) return;

    const bar = document.createElement('div');
    bar.className = 'dc-mobile-actions';
    bar.setAttribute('aria-label', 'Швидкі дії DIESEL-CRAFT');
    bar.innerHTML = `
      <div class="dc-mobile-route-sheet" id="dc-mobile-route-sheet" aria-hidden="true">
        <div class="dc-mobile-route-head">
          <span>Прокласти маршрут</span>
          <button type="button" class="dc-mobile-route-close" aria-label="Закрити вибір адреси">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <a class="dc-mobile-route-option" href="${addresses.address1.mapUrl}" target="_blank" rel="noopener noreferrer" data-address-id="address1">
          <span class="dc-mobile-route-num">01</span>
          <span><strong>${addresses.address1.title}</strong><small>${addresses.address1.subtitle}</small></span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
        <a class="dc-mobile-route-option" href="${addresses.address2.mapUrl}" target="_blank" rel="noopener noreferrer" data-address-id="address2">
          <span class="dc-mobile-route-num">02</span>
          <span><strong>${addresses.address2.title}</strong><small>${addresses.address2.subtitle}</small></span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>
      <div class="dc-mobile-actions-shell">
        <a href="tel:${phones.address1.tel}" class="dc-mobile-action-call" aria-label="Подзвонити в DIESEL-CRAFT">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.09 2.19 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span><strong>Позвонить</strong><small>${phones.address1.label}</small></span>
        </a>
        <button type="button" class="dc-mobile-route-toggle" aria-expanded="false" aria-controls="dc-mobile-route-sheet">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/></svg>
          <span><strong>Маршрут</strong><small>2 адреса</small></span>
        </button>
      </div>
    `;
    document.body.appendChild(bar);

    const routeToggle = bar.querySelector('.dc-mobile-route-toggle');
    const routeSheet = bar.querySelector('.dc-mobile-route-sheet');
    const closeButton = bar.querySelector('.dc-mobile-route-close');

    routeToggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const open = !bar.classList.contains('is-route-open');
      bar.classList.toggle('is-route-open', open);
      routeToggle.setAttribute('aria-expanded', String(open));
      routeSheet.setAttribute('aria-hidden', String(!open));
    });

    closeButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeMobileRoutePicker();
    });

    bar.querySelectorAll('.dc-mobile-route-option').forEach((option) => {
      option.addEventListener('click', () => {
        const addressId = option.getAttribute('data-address-id');
        if (addressId) setAddress(addressId);
        closeMobileRoutePicker();
      }, { capture: true });
    });

    document.addEventListener('click', (event) => {
      if (!bar.contains(event.target)) closeMobileRoutePicker();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileRoutePicker();
    });
  };

  const init = () => {
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
    document.addEventListener('click', trackLeadClick, { capture: true });

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