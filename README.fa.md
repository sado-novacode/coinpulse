# ⚡ کوین‌پالس (CoinPulse) — راهنمای فارسی

داشبورد رمزارز با قیمت‌های لحظه‌ای، نمودار کندل‌استیک، پورتفوی و هشدار قیمت.

> این فایل راهنمای سریع خودت است. فایل `README.md` (انگلیسی) را برای گیت‌هاب دست نزن — همان چیزی است که کارفرما می‌بیند.

## اجرا روی سیستم خودت (ویندوز / مک / لینوکس)

پیش‌نیاز: **Node.js نسخه ۲۰ یا بالاتر** از [nodejs.org](https://nodejs.org) نصب باشد.

ترمینال را در پوشه پروژه باز کن و این ۳ دستور را به ترتیب بزن:

```bash
npm install        # نصب پکیج‌ها (فقط بار اول، چند دقیقه طول می‌کشد)
npm run db:push    # ساختن دیتابیس SQLite (فایل dev.db خودکار ساخته می‌شود)
npm run dev        # اجرای پروژه
```

بعد مرورگر را باز کن: **http://localhost:3000** 🎉

### نکته‌ها

- قبل از اجرا یک‌بار فایل `.env.example` را به `.env` کپی کن (دستور ساخت دیتابیس هم بدون آن کار می‌کند، ولی درست‌تر همین است):
  - ویندوز (PowerShell): `copy .env.example .env`
  - مک/لینوکس: `cp .env.example .env`
- هر وقت خواستی نسخه نهایی بسازی: `npm run build` و بعد `npm start`
- داده‌ها از API‌های عمومی CoinLore و Binance می‌آیند — **نیازی به API key نداری.**
- دیتابیس SQLite است؛ هیچ نصب اضافه‌ای نمی‌خواهد. فایلش `prisma/dev.db` است.

## استفاده از پروژه برای کاریابی

1. **گیت‌هاب:** یک ریپوی جدید بساز و این پوشه را push کن (فایل `.gitignore` آماده است؛ `node_modules` و دیتابیس آپلود نمی‌شوند):

```bash
git init
git add .
git commit -m "CoinPulse — real-time crypto dashboard"
git branch -M main
git remote add origin https://github.com/<username>/coinpulse.git
git push -u origin main
```

2. **دموی زنده (رایگان):** در [vercel.com](https://vercel.com) با اکانت گیت‌هاب وارد شو → Add New Project → ریپو را انتخاب کن → در بخش Environment Variables مقدار `DATABASE_URL=file:./dev.db` را اضافه کن → Deploy.

> ⚠️ روی Vercel دیتابیس SQLite هر بار سرور cold استارت می‌شود ریست می‌شود. برای رزومه مشکلی نیست، ولی اگر خواستی داده ماندگار باشد، در `prisma/schema.prisma` گزینه Turso یا Postgres را جایگزین کن (در README انگلیسی توضیح داده شده).

3. **قبل از معرفی، این دو کار را بکن:**
   - در فایل `LICENSE` به‌جای `<Your Name>` اسم خودت را بنویس.
   - چند هشدار و دارایی آزمایشی بساز تا اسکرین‌شات‌های تازه بگیری؛ در README انگلیسی پوشه `screenshots/` را با عکس‌های خودت به‌روز کن.

## پوشه python-worker (امتیاز اضافه)

یک اسکریپت پایتون مستقل برای **ارسال هشدارها به تلگرام** — این را در مصاحبه به‌عنوان نمونه کار Backend نشان بده:

```
cd python-worker
pip install -r requirements.txt
# توکن ربات و chat_id را در alerts.json بگذار
python telegram_alerts.py
```

توضیح کامل داخل `python-worker/README.md` آمده است.

## ساختار پروژه (خلاصه)

```
src/app/page.tsx        ← کل رابط کاربری (بازار / ارز / پورتفوی / هشدارها)
src/app/api/            ← ۵ مسیر API با کش سمت سرور
src/components/coinpulse/ ← ۱۵ کامپوننت
src/lib/market.ts       ← دریافت و کش داده از CoinLore و Binance
src/lib/i18n.ts         ← دیکشنری EN/FA + راست‌چین
prisma/schema.prisma    ← دو مدل: Holding و Alert
```
