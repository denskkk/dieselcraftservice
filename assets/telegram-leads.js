(() => {
  if (window.__dieselCraftTelegramLeadsReady) return;
  window.__dieselCraftTelegramLeadsReady = true;

  const endpoint = 'https://script.google.com/macros/s/AKfycbz8GGK0KJAMZnMXE-hHVzyO_VGtQmAyAAGIGeOg_4egQDyrk8Y53KJXe7E6ErxTAuztYA/exec';

  const getEndpoint = () => (
    window.DIESEL_CRAFT_TELEGRAM_ENDPOINT
    || document.querySelector('meta[name="telegram-leads-endpoint"]')?.content
    || endpoint
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

  document.addEventListener('submit', async (event) => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form?.matches('form[data-lead-form]')) return;

    const telegramEndpoint = getEndpoint();
    if (!telegramEndpoint) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const payload = getLeadPayload(form);
    const phoneField = form.querySelector('[name="phone"]');
    if (!payload.phone) {
      phoneField?.focus();
      phoneField?.reportValidity();
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    setButtonState(submitButton, true);

    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'lead_form_submit',
        lead_source: payload.source,
        lead_service: payload.service || 'not_selected',
        lead_channel: 'telegram',
      });

      await fetch(telegramEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      form.reset();
      showFormStatus(form, 'Заявку відправлено. Майстер скоро звʼяжеться з вами.');
    } catch {
      showFormStatus(form, 'Не вдалося відправити заявку. Спробуйте подзвонити або написати у Viber.', true);
    } finally {
      setButtonState(submitButton, false);
    }
  }, { capture: true });
})();