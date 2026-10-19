/**
 * DIESEL-CRAFT — relay "website form → Telegram group".
 * Deploy as a Google Apps Script Web App (see README.md in this folder).
 *
 * The bot token is NOT stored in the website code. Keep it in
 * Project Settings → Script properties:
 *   TELEGRAM_BOT_TOKEN = <token from @BotFather>
 *   TELEGRAM_CHAT_ID   = <group id, e.g. -100...>
 */

const MAX_LEADS_PER_MINUTE = 20;

function doGet() {
  return json_({ ok: true, service: 'diesel-craft-leads' });
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Honeypot: bots fill hidden fields. Pretend success, send nothing.
    if (data.company_website) return json_({ ok: true });

    const phone = String(data.phone || '').trim().slice(0, 40);
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return json_({ ok: false, error: 'phone' });

    const cache = CacheService.getScriptCache();
    // The same phone within 60 s (double click / resubmit) is treated as already delivered.
    if (cache.get('p' + digits)) return json_({ ok: true, duplicate: true });
    const minuteKey = 'm' + Math.floor(Date.now() / 60000);
    const count = Number(cache.get(minuteKey) || 0);
    if (count >= MAX_LEADS_PER_MINUTE) return json_({ ok: false, error: 'rate_limited' });
    cache.put(minuteKey, String(count + 1), 120);

    const sent = sendTelegram_(buildMessage_(data, phone));
    if (!sent) return json_({ ok: false, error: 'telegram' });

    cache.put('p' + digits, '1', 60);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function buildMessage_(d, phone) {
  const lang = d.lang === 'ru' ? 'RU' : 'UA';
  const utm = [d.utm_source, d.utm_medium, d.utm_campaign].filter(Boolean).join(' / ');
  const head = ['🛠 <b>Нова заявка з сайту DIESEL-CRAFT</b>'];
  const client = [
    '📞 <b>Телефон:</b> ' + esc_(phone),
    d.name ? "👤 <b>Ім'я:</b> " + esc_(d.name) : '',
    d.service ? '🔧 <b>Послуга:</b> ' + esc_(d.service) : '',
    d.car ? '🚗 <b>Авто:</b> ' + esc_(d.car) : '',
    d.message ? '💬 <b>Проблема:</b> ' + esc_(d.message) : '',
  ];
  const meta = [
    '📄 <b>Форма:</b> ' + esc_(d.source || '—'),
    d.page_url ? '🔗 ' + esc_(d.page_url) : '',
    '🗣 <b>Мова сайту:</b> ' + lang,
    utm ? '📊 <b>Джерело:</b> ' + esc_(utm) : '',
    d.gclid || d.gbraid || d.wbraid ? '🎯 <b>Google Ads:</b> так' : '',
    '🕒 ' + Utilities.formatDate(new Date(), 'Europe/Kyiv', 'dd.MM.yyyy HH:mm'),
  ];
  const block = (arr) => arr.filter(Boolean).join('\n');
  return [block(head), block(client), block(meta)].join('\n\n');
}

function sendTelegram_(text) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_BOT_TOKEN');
  const chatId = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chatId) throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Script properties');
  const res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML', disable_web_page_preview: true }),
    muteHttpExceptions: true,
  });
  const body = JSON.parse(res.getContentText() || '{}');
  if (!body.ok) console.error('Telegram error: ' + res.getContentText());
  return body.ok === true;
}

function esc_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .slice(0, 1000);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor (▶ Run → testTelegram) to check the bot can post to the group. */
function testTelegram() {
  const ok = sendTelegram_('✅ <b>Тест:</b> бот DIESEL-CRAFT підключено до форм сайту.');
  console.log(ok ? 'OK — message sent' : 'FAILED — see log');
}
