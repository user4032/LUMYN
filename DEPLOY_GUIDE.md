# Deploy LUMYN Messenger

Швидкий гайд деплою на безкоштовні хостинги.

---

## 1. Backend (Render Free Tier)

### 1.1 MongoDB Atlas (безкоштовна база)
1. Зареєструйся на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Створи безкоштовний кластер (M0 Sandbox)
3. Додай свою IP у Network Access (або `0.0.0.0/0` для усіх)
4. Створи database user
5. Скопіюй connection string: `mongodb+srv://user:password@cluster.mongodb.net/lumyn`

### 1.2 Render
1. Зареєструйся на [Render](https://render.com)
2. Натисни **New** → **Web Service**
3. Підключи свій GitHub репозиторій `LUMYN`
4. Налаштування:
   - **Name**: `lumyn-backend` (або своє ім'я)
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Environment Variables (додай у Render):
   ```
   NODE_ENV=production
   PORT=4777
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/lumyn
   SOCKET_IO_CORS_ORIGIN=*
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=твій-емейл@gmail.com
   SMTP_PASS=твій-app-password
   SMTP_FROM=LUMYN
   AUTH_DEV_CODE=false
   JWT_SECRET=твій-секретний-ключ-мінімум-32-символи
   SESSION_SECRET=твій-session-секрет-мінімум-32-символи
   ```
6. Deploy!

Після деплою отримаєш URL типу: `https://lumyn-backend.onrender.com`

---

## 2. Frontend (Vercel Free Tier)

1. Зареєструйся на [Vercel](https://vercel.com)
2. Імпортуй проєкт з GitHub (`LUMYN`)
3. Налаштування:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variables (додай у Vercel):
   ```
   VITE_API_URL=https://lumyn-backend.onrender.com
   VITE_WS_URL=wss://lumyn-backend.onrender.com
   ```
5. Deploy!

Після деплою отримаєш URL типу: `https://lumyn.vercel.app`

---

## 3. Альтернативи

### Railway (backend + frontend разом)
1. [Railway](https://railway.app) – $5 безкоштовних на місяць
2. Deploy з GitHub – автоматично знайде `server/package.json` і `client/package.json`
3. Додай environment змінні як вище

### Fly.io (backend)
1. [Fly.io](https://fly.io) – безкоштовно до 3 VM
2. `fly launch` у папці `server/`
3. Додай змінні через `fly secrets set KEY=VALUE`

---

## 4. Важливо після деплою

1. **CORS**: У `server/app.js` перевір, що `SOCKET_IO_CORS_ORIGIN` дозволяє твій Vercel URL
2. **WebSocket**: Переконайся, що frontend використовує `wss://` для production
3. **Health check**: Відкрий `https://lumyn-backend.onrender.com/health` – має повернути `{"ok":true}`

---

## 5. Поділитися з друзями

Просто дай їм: `https://lumyn.vercel.app`

Без паролів локалтунелю, без 503, все працює 24/7 🚀
