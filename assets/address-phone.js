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

  const setAddress = (addressId, persist = true) => {
    const selectedAddress = phones[addressId] ? addressId : 'address1';
    const phone = phones[selectedAddress];
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => syncPhoneLink(link, phone));
    syncAddressOptions(selectedAddress);
    if (persist) saveAddress(selectedAddress);
  };

  const init = () => {
    const hashAddress = getAddressId(window.location.hash);
    setAddress(hashAddress || readSavedAddress() || 'address1', false);

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