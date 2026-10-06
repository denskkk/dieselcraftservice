# TRACKING — відстеження конверсій DIESEL-CRAFT

Архітектура: **GTM + dataLayer** (контейнер `GTM-WK4DDLGB`). Сайт лише публікує події в `dataLayer`, усі теги (GA4, Google Ads) живуть у GTM. Нових систем аналітики не додавалося.

Ідентифікатори, які вже працюють у контейнері (видно в мережевих запитах сторінок):
GTM `GTM-WK4DDLGB` · GA4 `G-CXXMMKQJ2W` · Google Ads `AW-17927910116`.
**Conversion label'ів у коді немає — вони створюються в Google Ads і вставляються в GTM** (див. нижче).

---

## 1. Події dataLayer

| Подія | Коли | Де в коді |
|---|---|---|
| `click_phone` | клік по будь-якому `tel:` | `assets/address-phone.js` |
| `click_whatsapp` / `click_telegram` / `click_viber` | клік по месенджеру | `assets/address-phone.js` |
| `click_map` | клік «Маршрут» (Google Maps) | `assets/address-phone.js` |
| `lead_form_start` | перший фокус у формі | `assets/telegram-leads.js` |
| `lead_form_validation_error` | некоректний телефон | `assets/telegram-leads.js` |
| `lead_form_whatsapp_open` | заявка відкрила WhatsApp | `assets/telegram-leads.js` |
| `lead_form_submit_success` | заявка відправлена на endpoint | `assets/telegram-leads.js` |
| `lead_form_submit_error` | помилка відправки | `assets/telegram-leads.js` |
| **`form_submit`** | **єдина подія конверсії форми** — разом з `whatsapp_open` або `submit_success` | `assets/telegram-leads.js` |

Відповідність вашому ТЗ: `phone_click` = `click_phone`, `messenger_click` = `click_whatsapp|click_telegram|click_viber`, `directions_click` = `click_map`, `form_submit` = `form_submit`. Старі назви збережено, щоб не зламати вже налаштований GTM. Email на сайті не використовується.

### Параметри `click_*`
`phone_number`, `contact_channel`, `cta_location` (header / hero / mobile_sticky / section_cta / content), `device_type`, `landing_page`, `service` (H1 сторінки), `link_url`, `link_text`, `page_path`, `page_title` + атрибуція (нижче).

### Параметри `form_submit` та `lead_form_*`
`lead_source`, `lead_service`, `lead_channel`, `landing_page`, `device_type` + атрибуція.

### Атрибуція (gclid / UTM)
При заході з реклами `address-phone.js` зберігає в `localStorage` (ключ `dieselCraftAttribution`, **90 днів**): `gclid`, `gbraid`, `wbraid`, `utm_source/medium/campaign/term/content` і `landing_page`. Новий клік по рекламі перезаписує попередній. Ці значення додаються до всіх подій вище **і до самої заявки** (поля payload, що йдуть у backup-endpoint/Telegram), тому gclid не губиться, коли людина перейшла з лендингу на контакти.

---

## 2. Налаштування GTM

**Теги:** Conversion Linker (All Pages) → Google Ads Remarketing (All Pages) → теги конверсій нижче.
**Тригери (Custom Event):** `click_phone`, `form_submit`, `click_map`, `click_whatsapp|click_telegram|click_viber` (regex).
**Змінні (Data Layer Variable):** `gclid`, `utm_campaign`, `cta_location`, `service`, `landing_page`, `phone_number`.

| Конверсія Google Ads | Тригер GTM | Статус | Значення |
|---|---|---|---|
| Дзвінок з оголошення (Call reporting, від 45 с) | — (створюється в ассеті) | **Primary** | 350 ₴ |
| Клік по телефону | `click_phone` | **Primary** | 300 ₴ |
| Відправка форми | `form_submit` | **Primary** | 250 ₴ |
| Месенджери | messenger regex | Secondary | 120 ₴ |
| Маршрут | `click_map` | Secondary | 80 ₴ |

⚠️ Не вішайте конверсію на `lead_form_*` разом з `form_submit` — буде дубль.
Значення — стартові орієнтири, уточніть за реальним середнім чеком.

---

## 3. Як перевірити

1. **GTM Preview** → відкрийте сайт за посиланням `…/?gclid=TEST&utm_source=google&utm_campaign=test`.
2. Клікніть телефон у шапці, hero та мобільній панелі → у Tag Assistant має бути `click_phone` з `gclid=TEST`.
3. Перейдіть на іншу сторінку **без параметрів**, клікніть телефон → `gclid` має зберегтися.
4. Відправте форму → `lead_form_*` + `form_submit`.
5. **GA4 → Admin → DebugView**: бачите ті самі події в реальному часі.
6. **Google Ads → Goals → Conversions**: статус «Recording conversions» з'являється за 3–24 год. Діагностика: колонка *Status* та вкладка *Diagnostics*.
7. Реальний тестовий дзвінок з реклами (для Call reporting) — перевірте, що дзвінок з'явився у звіті.
8. **Опублікуйте контейнер GTM** — без публікації нічого не працює.

## 4. Чого немає (свідомо)
- **Consent Mode v2 та cookie-банера.** Для націлення лише на Україну не обов'язково. Якщо рекламу показуватимете в ЄС — це потрібно зробити окремо.
- Enhanced conversions: можна ввімкнути, телефон з форми доступний у payload; спершу оновіть `privacy.html`.
