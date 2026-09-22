(() => {
  if (window.__dieselCraftTelegramLeadsReady) return;
  window.__dieselCraftTelegramLeadsReady = true;

  const backupEndpoint = 'https://script.google.com/macros/s/AKfycbz8GGK0KJAMZnMXE-hHVzyO_VGtQmAyAAGIGeOg_4egQDyrk8Y53KJXe7E6ErxTAuztYA/exec';
  const defaultWhatsAppPhone = '380933838363';

  const getVerifiedEndpoint = () => (
    window.DIESEL_CRAFT_LEAD_API_ENDPOINT
    || document.querySelector('meta[name="lead-api-endpoint"]')?.content
    || ''
  ).trim();

  const getBackupEndpoint = () => (
    window.DIESEL_CRAFT_TELEGRAM_ENDPOINT
    || document.querySelector('meta[name="telegram-leads-endpoint"]')?.content
    || backupEndpoint
  ).trim();

  const setButtonState = (button, pending) => {
    if (!button) return;
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent.trim();
    button.disabled = pending;
    button.style.opacity = pending ? '0.75' : '';
    button.style.cursor = pending ? 'wait' : '';
    if (pending) {
      button.textContent = 'Відправляємо...';
    } else {
      button.textContent = button.dataset.originalText;
    }
  };

  const showFormStatus = (form, message, isError = false) => {
    let status = form.querySelector('[data-form-status]');
    if (!status) {
      status = document.createElement('p');
      status.dataset.formStatus = 'true';
      status.style.marginTop = '12px';
      status.style.fontSize = '0.9rem';
      status.style.fontWeight = '700';
      form.appendChild(status);
    }
    status.textContent = message;
    status.style.color = isError ? '#ef4444' : '#22c55e';
    return status;
  };

  const showFormFallback = (form) => {
    const status = showFormStatus(form, 'Не вдалося надіслати заявку. ', true);
    const callLink = document.createElement('a');
    callLink.href = `tel:+${defaultWhatsAppPhone}`;
    callLink.textContent = 'Зателефонуйте нам';
    callLink.style.color = 'inherit';
    callLink.style.textDecoration = 'underline';

    const separator = document.createTextNode(' або ');
    const messageLink = document.createElement('a');
    messageLink.href = `https://wa.me/${defaultWhatsAppPhone}`;
    messageLink.target = '_blank';
    messageLink.rel = 'noopener noreferrer';
    messageLink.textContent = 'напишіть у WhatsApp';
    messageLink.style.color = 'inherit';
    messageLink.style.textDecoration = 'underline';

    status.replaceChildren(status.firstChild, callLink, separator, messageLink, '.');
  };

  const getLeadPayload = (form) => {
    const formData = new FormData(form);
    const serviceSelect = form.querySelector('[name="service"]');
    const service = serviceSelect?.value ? serviceSelect.selectedOptions[0].textContent.trim() : '';

    return {
      source: form.dataset.leadSource || document.title,
      page_title: document.title,
      page_url: window.location.href,
      name: String(formData.get('name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      service,
      car: String(formData.get('car') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      submitted_at: new Date().toISOString(),
    };
  };

  const pushLeadEvent = (event, payload, channel) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event,
      lead_source: payload.source,
      lead_service: payload.service || 'not_selected',
      lead_channel: channel,
    });
  };

  const sendBackupLead = (payload) => {
    const endpoint = getBackupEndpoint();
    if (!endpoint) return;

    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon?.(endpoint, new Blob([body], { type: 'text/plain;charset=utf-8' }))) return;
      fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
      }).catch(() => {});
    } catch {
      // The user-facing fallback below remains available if the backup webhook is unavailable.
    }
  };

  const sendVerifiedLead = async (endpoint, payload) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Lead endpoint returned ${response.status}`);
  };

  const openWhatsApp = (payload, form) => {
    const phone = form.dataset.whatsappPhone || defaultWhatsAppPhone;
    const lines = [
      'Нова заявка з сайту DIESEL-CRAFT',
      `Сторінка: ${payload.source}`,
      `Ім\'я: ${payload.name || 'не вказано'}`,
      `Телефон: ${payload.phone}`,
      payload.service ? `Послуга: ${payload.service}` : '',
      payload.car ? `Авто: ${payload.car}` : '',
      payload.message ? `Проблема: ${payload.message}` : '',
    ].filter(Boolean);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
    const popup = window.open(url, '_blank');
    if (popup) popup.opener = null;
    if (!popup) window.location.assign(url);
  };

  const startedForms = new WeakSet();

  document.addEventListener('focusin', (event) => {
    const field = event.target instanceof Element ? event.target : null;
    const form = field?.closest('form[data-lead-form]');
    if (!form || startedForms.has(form)) return;

    startedForms.add(form);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'lead_form_start',
      lead_source: form.dataset.leadSource || document.title,
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }, { capture: true });

  document.addEventListener('submit', async (event) => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form?.matches('form[data-lead-form]')) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const payload = getLeadPayload(form);
    const phoneField = form.querySelector('[name="phone"]');
    const phoneDigits = payload.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      phoneField?.focus();
      phoneField?.reportValidity();
      pushLeadEvent('lead_form_validation_error', payload, 'form');
      showFormStatus(form, 'Вкажіть коректний номер телефону для звʼязку.', true);
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    const verifiedEndpoint = getVerifiedEndpoint();

    if (!verifiedEndpoint) {
      sendBackupLead(payload);
      openWhatsApp(payload, form);
      pushLeadEvent('lead_form_whatsapp_open', payload, 'whatsapp');
      form.reset();
      showFormStatus(form, 'Відкрили WhatsApp. Надішліть повідомлення, щоб майстер отримав заявку.');
      return;
    }

    setButtonState(submitButton, true);

    try {
      await sendVerifiedLead(verifiedEndpoint, payload);

      form.reset();
      pushLeadEvent('lead_form_submit_success', payload, 'form');
      showFormStatus(form, 'Заявку відправлено. Майстер скоро звʼяжеться з вами.');
    } catch {
      sendBackupLead(payload);
      pushLeadEvent('lead_form_submit_error', payload, 'form');
      showFormFallback(form);
    } finally {
      setButtonState(submitButton, false);
    }
  }, { capture: true });
})();