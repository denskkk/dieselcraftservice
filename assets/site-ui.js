/* DIESEL-CRAFT site UI: cookie consent (Google Consent Mode v2), UA/RU language prompt, lead modal. */
(() => {
  if (window.__dieselCraftSiteUi) return;
  window.__dieselCraftSiteUi = true;

  const doc = document;
  const isRu = (doc.documentElement.lang || '').toLowerCase().startsWith('ru');
  const t = (uk, ru) => (isRu ? ru : uk);
  const scriptEl = doc.currentScript || doc.querySelector('script[src*="site-ui.js"]');
  const assetsBase = new URL('.', scriptEl ? scriptEl.src : window.location.href);
  const siteRoot = new URL('../', assetsBase);
  const store = {
    get: (k) => { try { return window.localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { window.localStorage.setItem(k, v); } catch { /* storage may be blocked */ } },
  };
  window.dataLayer = window.dataLayer || [];
  const gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  const track = (event, extra = {}) => window.dataLayer.push({ event, page_path: window.location.pathname, ...extra });
  const icon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const PHONE = { tel: '+380933838363', label: '+380 93 383 83 63' };

  const cssReady = new Promise((resolve) => {
    if (doc.querySelector('link[data-dcui-css]')) { resolve(); return; }
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('site-ui.css', assetsBase).href;
    link.dataset.dcuiCss = '';
    link.onload = resolve;
    link.onerror = resolve;
    doc.head.appendChild(link);
  });

  const showToast = (el) => {
    doc.body.appendChild(el);
    void el.offsetWidth; // start the CSS transition without relying on rAF (paused in background tabs)
    el.classList.add('is-visible');
  };
  const hideToast = (el) => {
    el.classList.remove('is-visible');
    setTimeout(() => el.remove(), 260);
  };

  /* ── Cookie consent ───────────────────────────────────────────── */
  const CONSENT_KEY = 'dcConsent';
  const applyConsent = (value) => {
    const state = value === 'granted' ? 'granted' : 'denied';
    gtag('consent', 'update', { ad_storage: state, ad_user_data: state, ad_personalization: state, analytics_storage: state });
    track('consent_update', { consent_state: value });
  };

  const askConsent = () => new Promise((resolve) => {
    const box = doc.createElement('div');
    box.className = 'dcui-toast dcui-cookie';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-label', t('Налаштування cookie', 'Настройки cookie'));
    box.innerHTML = `
      <p class="dcui-toast-title">${icon('<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1"/><circle cx="14.5" cy="14.5" r="1"/><circle cx="15" cy="8.5" r="1"/>')}${t('Ми використовуємо cookie', 'Мы используем cookie')}</p>
      <p>${t('Cookie допомагають рахувати відвідування і покращувати сайт (Google Analytics, Google Ads). Ви можете відмовитися — сайт працюватиме так само.', 'Cookie помогают считать посещения и улучшать сайт (Google Analytics, Google Ads). Вы можете отказаться — сайт будет работать так же.')}
      <a href="${new URL('privacy.html', siteRoot).href}">${t('Детальніше', 'Подробнее')}</a></p>
      <div class="dcui-actions">
        <button type="button" class="dcui-btn dcui-btn-primary" data-consent="granted">${t('Прийняти', 'Принять')}</button>
        <button type="button" class="dcui-btn dcui-btn-ghost" data-consent="denied">${t('Лише необхідні', 'Только необходимые')}</button>
      </div>`;
    box.addEventListener('click', (event) => {
      const button = event.target.closest('[data-consent]');
      if (!button) return;
      const value = button.dataset.consent;
      store.set(CONSENT_KEY, value);
      applyConsent(value);
      hideToast(box);
      resolve(value);
    });
    cssReady.then(() => showToast(box));
  });

  const consentSettled = store.get(CONSENT_KEY) ? Promise.resolve(store.get(CONSENT_KEY)) : askConsent();
  window.dieselCraftCookieSettings = () => { doc.querySelector('.dcui-cookie')?.remove(); askConsent(); };
  doc.addEventListener('click', (event) => {
    if (!event.target.closest('[data-cookie-settings]')) return;
    event.preventDefault();
    window.dieselCraftCookieSettings();
  });

  /* ── Language prompt (UA pages that have a RU version) ────────── */
  const LANG_KEY = 'dcLang';
  doc.addEventListener('click', (event) => {
    const link = event.target.closest('.dcx-lang a[hreflang]');
    if (link) store.set(LANG_KEY, link.getAttribute('hreflang'));
  }, true);

  const ruLink = doc.querySelector('.dcx-lang a[hreflang="ru"]');
  if (!isRu && ruLink && !store.get(LANG_KEY)) {
    consentSettled.then(() => setTimeout(() => {
      if (store.get(LANG_KEY)) return;
      const box = doc.createElement('div');
      box.className = 'dcui-toast dcui-lang';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-label', 'Мова сайту / Язык сайта');
      box.innerHTML = `
        <p class="dcui-toast-title">${icon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>')}Мова сайту · Язык сайта</p>
        <p>Залишитися на українській версії чи перейти на російську?<br><span lang="ru">Остаться на украинской версии или перейти на русскую?</span></p>
        <div class="dcui-actions">
          <button type="button" class="dcui-btn dcui-btn-ghost" data-lang="uk" lang="uk">Українська</button>
          <a class="dcui-btn dcui-btn-primary" data-lang="ru" lang="ru" hreflang="ru" href="${ruLink.href}">Русский</a>
        </div>`;
      box.addEventListener('click', (event) => {
        const choice = event.target.closest('[data-lang]');
        if (!choice) return;
        store.set(LANG_KEY, choice.dataset.lang);
        track('language_prompt_choice', { language: choice.dataset.lang });
        if (choice.dataset.lang === 'uk') hideToast(box);
      });
      cssReady.then(() => showToast(box));
    }, 1200));
  }

  /* ── Lead modal ───────────────────────────────────────────────── */
  const SERVICES = isRu
    ? [['diagnostics', 'Компьютерная диагностика'], ['engine', 'Ремонт / капремонт двигателя'], ['injectors', 'Ремонт форсунок'], ['np', 'Ремонт насос-форсунок'], ['tnvd', 'Ремонт ТНВД'], ['turbo', 'Ремонт турбины'], ['gbc', 'Ремонт ГБЦ'], ['fuel', 'Топливная система Common Rail'], ['egr', 'EGR / DPF'], ['commercial', 'Коммерческий транспорт / спецтехника'], ['generator', 'Дизельный генератор'], ['chip', 'Чип-тюнинг'], ['ac', 'Заправка кондиционера'], ['other', 'Другое']]
    : [['diagnostics', "Комп'ютерна діагностика"], ['engine', 'Ремонт / капремонт двигуна'], ['injectors', 'Ремонт форсунок'], ['np', 'Ремонт насос-форсунок'], ['tnvd', 'Ремонт ТНВД'], ['turbo', 'Ремонт турбіни'], ['gbc', 'Ремонт ГБЦ'], ['fuel', 'Паливна система Common Rail'], ['egr', 'EGR / DPF'], ['commercial', 'Комерційний транспорт / спецтехніка'], ['generator', 'Дизельний генератор'], ['chip', 'Чіп-тюнінг'], ['ac', 'Заправка кондиціонера'], ['other', 'Інше']];
  const guessService = () => {
    const inline = doc.querySelector('#dcx-service');
    if (inline?.value) return inline.value;
    const p = window.location.pathname;
    const map = [[/nasos-forsunok/, 'np'], [/forsunok/, 'injectors'], [/tnvd/, 'tnvd'], [/turbin/, 'turbo'], [/gbc/, 'gbc'], [/palyvnoi/, 'fuel'],
      [/diagnostyka-egr|dpf|egr/, 'egr'], [/diagnostyka/, 'diagnostics'], [/dvyguniv|dvyguny/, 'engine'], [/komertsiinogo/, 'commercial'],
      [/generatoriv/, 'generator'], [/chip-tuning/, 'chip'], [/kondytsionera/, 'ac']];
    return (map.find(([re]) => re.test(p)) || [null, ''])[1];
  };

  let modal = null;
  let lastFocus = null;

  const ensureLeadScript = () => {
    if (window.__dieselCraftTelegramLeadsReady || doc.querySelector('script[src*="telegram-leads.js"]')) return;
    const s = doc.createElement('script');
    s.src = new URL('telegram-leads.js', assetsBase).href;
    doc.body.appendChild(s);
  };

  const buildModal = () => {
    const selected = guessService();
    const options = [`<option value="">${t('Оберіть послугу', 'Выберите услугу')}</option>`]
      .concat(SERVICES.map(([v, n]) => `<option value="${v}"${v === selected ? ' selected' : ''}>${n}</option>`)).join('');
    const pageName = (doc.querySelector('h1')?.textContent || doc.title).replace(/\s+/g, ' ').trim().slice(0, 80);
    const el = doc.createElement('div');
    el.className = 'dcui-modal';
    el.hidden = true;
    el.innerHTML = `
      <div class="dcui-backdrop" data-close></div>
      <div class="dcui-dialog" role="dialog" aria-modal="true" aria-labelledby="dcui-lead-title">
        <div class="dcui-head">
          <button type="button" class="dcui-close" data-close aria-label="${t('Закрити', 'Закрыть')}">${icon('<path d="M18 6L6 18M6 6l12 12"/>')}</button>
          <span class="dcui-kicker">DIESEL-CRAFT · ${t('Одеса', 'Одесса')}</span>
          <h2 class="dcui-title" id="dcui-lead-title">${t('Залишити заявку', 'Оставить заявку')}</h2>
          <p class="dcui-sub">${t('Передзвонимо в робочий час, уточнимо симптоми і запишемо на зручний час.', 'Перезвоним в рабочее время, уточним симптомы и запишем на удобное время.')}</p>
        </div>
        <div class="dcui-body">
          <form class="dcui-form" action="https://wa.me/380933838363" method="GET" data-lead-form data-lead-source="${t('Вікно заявки', 'Окно заявки')} — ${pageName.replace(/"/g, '')}" novalidate>
            <div class="dcui-field dcui-phone-field"><label for="dcui-phone">${t('Ваш телефон', 'Ваш телефон')}</label><input type="tel" id="dcui-phone" name="phone" placeholder="+380 __ ___ __ __" autocomplete="tel" inputmode="tel" required></div>
            <div class="dcui-row">
              <div class="dcui-field"><label for="dcui-name">${t("Ім'я", 'Имя')} <span>${t("(необов'язково)", '(необязательно)')}</span></label><input type="text" id="dcui-name" name="name" autocomplete="given-name"></div>
              <div class="dcui-field"><label for="dcui-service">${t('Послуга', 'Услуга')}</label><select id="dcui-service" name="service">${options}</select></div>
            </div>
            <div class="dcui-field"><label for="dcui-car">${t('Авто', 'Авто')} <span>${t('(марка, модель, рік)', '(марка, модель, год)')}</span></label><input type="text" id="dcui-car" name="car" placeholder="${t('Напр.: VW Crafter 2.0 TDI, 2016', 'Напр.: VW Crafter 2.0 TDI, 2016')}" autocomplete="off"></div>
            <div class="dcui-field"><label for="dcui-msg">${t('Що турбує', 'Что беспокоит')} <span>${t("(необов'язково)", '(необязательно)')}</span></label><textarea id="dcui-msg" name="message" placeholder="${t('Дим, не заводиться, втрата тяги, помилки…', 'Дым, не заводится, потеря тяги, ошибки…')}"></textarea></div>
            <div aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;"><input type="text" name="company_website" tabindex="-1" autocomplete="off" data-lead-trap></div>
            <button type="submit" class="dcui-btn dcui-btn-primary dcui-submit">${t('Надіслати заявку', 'Отправить заявку')}</button>
            <p class="dcui-note">${t('Надсилаючи форму, ви погоджуєтесь з', 'Отправляя форму, вы соглашаетесь с')} <a href="${new URL('privacy.html', siteRoot).href}">${t('політикою конфіденційності', 'политикой конфиденциальности')}</a>.</p>
            <div class="dcui-alt">${t('Або зателефонуйте:', 'Или позвоните:')} <a href="tel:${PHONE.tel}">${PHONE.label}</a></div>
          </form>
        </div>
        <div class="dcui-success" role="status">
          <div class="dcui-check">${icon('<path d="M20 6L9 17l-5-5"/>')}</div>
          <h3 data-success-title>${t('Дякуємо! Заявку отримано', 'Спасибо! Заявка получена')}</h3>
          <p data-success-text>${t('Майстер передзвонить вам найближчим часом у робочий час: Пн–Пт 8:00–18:00, Сб 9:00–15:00.', 'Мастер перезвонит вам в ближайшее время в рабочее время: Пн–Пт 8:00–18:00, Сб 9:00–15:00.')}</p>
          <button type="button" class="dcui-btn dcui-btn-primary" data-close>${t('Закрити', 'Закрыть')}</button>
        </div>
      </div>`;
    el.addEventListener('click', (event) => { if (event.target.closest('[data-close]')) closeModal(); });
    doc.addEventListener('keydown', (event) => {
      if (el.hidden) return;
      if (event.key === 'Escape') { closeModal(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...el.querySelectorAll('button, a[href], input:not([tabindex="-1"]), select, textarea')].filter((n) => n.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    const form = el.querySelector('form');
    const showSuccess = () => {
      el.classList.add('is-success');
      el.querySelector('.dcui-dialog').scrollTop = 0;
      el.querySelector('.dcui-success [data-close]').focus({ preventScroll: true });
    };
    form.addEventListener('dc:lead-success', showSuccess);
    form.addEventListener('dc:lead-whatsapp', () => {
      el.querySelector('[data-success-title]').textContent = t('Майже готово', 'Почти готово');
      el.querySelector('[data-success-text]').textContent = t('Ми відкрили WhatsApp із текстом заявки — натисніть «Надіслати», щоб майстер її отримав.', 'Мы открыли WhatsApp с текстом заявки — нажмите «Отправить», чтобы мастер её получил.');
      showSuccess();
    });
    doc.body.appendChild(el);
    return el;
  };

  const openModal = (trigger) => {
    ensureLeadScript();
    cssReady.then(() => {
      if (!modal) modal = buildModal();
      if (modal.classList.contains('is-success')) {
        modal.querySelector('[data-success-title]').textContent = t('Дякуємо! Заявку отримано', 'Спасибо! Заявка получена');
        modal.querySelector('[data-success-text]').textContent = t('Майстер передзвонить вам найближчим часом у робочий час: Пн–Пт 8:00–18:00, Сб 9:00–15:00.', 'Мастер перезвонит вам в ближайшее время в рабочее время: Пн–Пт 8:00–18:00, Сб 9:00–15:00.');
      }
      modal.classList.remove('is-success');
      modal.querySelector('[data-form-status]')?.remove();
      lastFocus = trigger || doc.activeElement;
      modal.hidden = false;
      doc.documentElement.classList.add('dcui-lock');
      void modal.offsetWidth;
      modal.classList.add('is-open');
      setTimeout(() => modal.querySelector('#dcui-phone')?.focus({ preventScroll: true }), 120);
      track('lead_modal_open', { cta_text: (trigger?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) });
    });
  };

  const closeModal = () => {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    doc.documentElement.classList.remove('dcui-lock');
    setTimeout(() => { if (!modal.classList.contains('is-open')) modal.hidden = true; }, 220);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
  };

  window.dieselCraftOpenLead = openModal;
  const TRIGGERS = '[data-open-lead], a[href$="#zayavka"], a.svc-cta-btn-secondary, a.cta-button[href$="#contacts"], a.hero-cta-secondary[href$="#contacts"]';
  // Capture phase: page scripts (smooth-scroll for #anchors) must not swallow the click first.
  doc.addEventListener('click', (event) => {
    const trigger = event.target.closest(TRIGGERS);
    if (!trigger || event.ctrlKey || event.metaKey || event.shiftKey || event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    openModal(trigger);
  }, true);
})();
