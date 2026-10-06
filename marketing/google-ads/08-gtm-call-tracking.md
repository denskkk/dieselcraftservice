# Відстеження дзвінків та заявок (GTM + Google Ads)

Контейнер GTM уже встановлений на всіх сторінках сайту: **GTM-WK4DDLGB**.
Сайт уже надсилає потрібні події в `dataLayer` — дописувати код **не потрібно**.

## Які події вже є в коді

| Подія `dataLayer` | Коли спрацьовує | Де реалізовано |
|---|---|---|
| `click_phone` | клік по будь-якому посиланню `tel:` | `assets/address-phone.js` |
| `click_whatsapp` | клік по WhatsApp | `assets/address-phone.js` |
| `click_telegram` | клік по Telegram | `assets/address-phone.js` |
| `click_viber` | клік по Viber | `assets/address-phone.js` |
| `click_map` | клік «Маршрут» / Google Maps | `assets/address-phone.js` |
| `lead_form_start` | користувач почав заповнювати форму | `assets/telegram-leads.js` |
| `lead_form_submit_success` | заявка успішно відправлена | `assets/telegram-leads.js` |
| `lead_form_whatsapp_open` | заявка пішла через WhatsApp | `assets/telegram-leads.js` |
| `lead_form_submit_error` | помилка відправки (для контролю) | `assets/telegram-leads.js` |
| `form_submit` | **єдина подія конверсії форми** (спрацьовує разом з success або whatsapp_open) | `assets/telegram-leads.js` |

Додаткові параметри в `click_phone`: `cta_location` (header / hero / mobile_sticky / section_cta / content),
`device_type`, `landing_page`, `gclid`, `utm_source`, `utm_campaign`.

---

## Крок 1. Конверсії в Google Ads

Інструменти → Конверсії → «+ Нова дія» → **Сайт** → ввести вручну.

| № | Назва дії | Категорія | Цінність | Підрахунок | Вікно | Основна? |
|---|---|---|---|---|---|---|
| 1 | Клік по телефону | Телефонні дзвінки | 300 UAH | Один | 30 днів | **Так** |
| 2 | Дзвінки з оголошень | Телефонні дзвінки | 350 UAH | Один | 30 днів | **Так** |
| 3 | Відправка форми | Відправлення форми | 250 UAH | Один | 30 днів | **Так** |
| 4 | WhatsApp / Telegram | Зв'язок | 120 UAH | Один | 30 днів | Ні (другорядна) |
| 5 | Клік «Маршрут» | Зв'язок | 80 UAH | Один | 30 днів | Ні (другорядна) |

Дія №2 створюється автоматично, коли ви вмикаєте **Call reporting** у телефонному ассеті
(див. `07-assets-extensions.md`). Мінімальна тривалість — 45 секунд.

> Чому значення саме такі: якщо середній чек ремонту ~6000 грн, а в клієнта
> конвертується приблизно кожен 5-й дзвінок — один дзвінок коштує вам ≈300 грн маржі.
> Ці цифри дають алгоритму орієнтир. Після 1-2 місяців уточніть їх за реальною статистикою.

Для кожної дії збережіть **Conversion ID** (`AW-XXXXXXXXX`) та **Conversion Label**.

---

## Крок 2. Налаштування GTM

### 2.1 Базові теги

1. **Conversion Linker**
   - Тип: `Conversion Linker`
   - Тригер: `All Pages`
   - *Без цього тега gclid не зберігається і конверсії губляться.*

2. **Google Ads Remarketing**
   - Тип: `Google Ads Remarketing`
   - Conversion ID: `AW-XXXXXXXXX`
   - Тригер: `All Pages`

### 2.2 Тригери (Custom Event)

Створити 5 тригерів типу **Користувацька подія**:

| Назва тригера | Ім'я події (регулярний вираз вимкнено) |
|---|---|
| CE — click_phone | `click_phone` |
| CE — form_submit | `form_submit` (єдиний тригер для конверсії форми; не додавайте поряд `lead_form_*`, інакше буде дубль) |
| CE — messenger_click | використати regex: `click_whatsapp\|click_telegram\|click_viber` |
| CE — click_map | `click_map` |

### 2.3 Теги конверсій

Для кожної дії створити тег **Google Ads Conversion Tracking**:

| Тег | Conversion ID | Label | Тригер | Value |
|---|---|---|---|---|
| Ads — Клік по телефону | AW-XXXXXXXXX | (з дії 1) | CE — click_phone | 300 |
| Ads — Відправка форми | AW-XXXXXXXXX | (з дії 3) | CE — form_submit | 250 |
| Ads — Месенджери | AW-XXXXXXXXX | (з дії 4) | CE — messenger_click | 120 |
| Ads — Маршрут | AW-XXXXXXXXX | (з дії 5) | CE — click_map | 80 |

Валюта у всіх тегах: **UAH**.

### 2.4 Змінні (для звітів)

Створити змінні типу **Змінна рівня даних**:
`cta_location`, `device_type`, `landing_page`, `lead_service`, `phone_number`.

Це дозволить бачити, яка саме кнопка дає дзвінки (мобільна липка панель зазвичай дає 50-70%).

---

## Крок 3. Перевірка перед запуском

1. GTM → **Попередній перегляд** → відкрити `https://diesel-craft.com.ua`.
2. Клікнути по телефону в шапці, у hero-блоці та на мобільній липкій панелі.
3. У Tag Assistant має спрацювати подія `click_phone` і тег «Ads — Клік по телефону».
4. Заповнити та відправити форму → подія `form_submit` (разом з `lead_form_whatsapp_open` або `lead_form_submit_success`).
5. Google Ads → Конверсії: протягом 3-24 годин статус має змінитись з «Немає останніх конверсій» на «Записується».
6. **Опублікувати** контейнер GTM (без публікації нічого працювати не буде).

---

## Крок 4. Зв'язати акаунти

- Google Ads ↔ **Google Analytics 4** (імпорт аудиторій та подій)
- Google Ads ↔ **Google Business Profile** (локальні ассети, дзвінки з Карт)
- Google Ads ↔ **Search Console** (звіт за пошуковими запитами)

---

## Крок 5. Розширені конверсії (Enhanced conversions) — опційно, +5-15% точності

Увімкнути в налаштуваннях конверсійної дії «Відправка форми», джерело даних — Google Tag Manager.
Форма вже збирає телефон користувача (`assets/telegram-leads.js`), тому в GTM достатньо
передати поле телефону в параметр `phone_number` з хешуванням на стороні Google.
Перед увімкненням переконайтесь, що політика конфіденційності на сайті це покриває
(`privacy.html` — оновити пункт про передачу даних рекламним системам).
