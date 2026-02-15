# LUMYN - Free Cloud Deployment Guide

Deploy LUMYN to the cloud for **FREE** using Railway.app + MongoDB Atlas!

---

## 📋 Step 1: Set Up MongoDB Atlas (FREE Database)

### 1.1 Create Account
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Start Free"
3. Sign up with email or GitHub
4. Create free cluster (M0 - 512MB storage)

### 1.2 Get Connection String
1. In Atlas Dashboard, click "Connect"
2. Choose "Connect your application"
3. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/lumyn?retryWrites=true&w=majority
   ```
4. Replace `username` and `password` with your credentials
5. Save this for later ✅

### 1.3 Create Database
1. In Atlas, go to "Databases"
2. Click "Browse Collections"
3. Create new database: `lumyn`
4. Collections will be created automatically by app

---

## 🚀 Step 2: Deploy to Railway.app (FREE)

### 2.1 Create Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (easiest)
3. Authorize GitHub access

### 2.2 Create New Project
1. Dashboard → "New Project"
2. Choose "GitHub Repo"
3. Select your LUMYN repository
4. Click "Deploy Now"

### 2.3 Configure Environment Variables
1. After project created, go to "Variables"
2. Add these environment variables:

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lumyn?retryWrites=true&w=majority
VITE_API_URL=https://your-app.railway.app
JWT_SECRET=generate-random-string-32-chars-minimum
SESSION_SECRET=generate-another-random-string-32-chars
SOCKET_IO_CORS_ORIGIN=*
```

### 2.4 Get Your Public URL
1. After deployment, go to "Settings"
2. Under "Domains", you'll see:
   ```
   https://lumyn-production.railway.app
   ```
3. Copy this URL - this is your **PUBLIC API URL** ✅

### 2.5 Update Environment Variables
1. Add second variable in Railway:
   ```
   VITE_API_URL=https://lumyn-production.railway.app
   ```

---

## 💻 Step 3: Update Your Local Configuration

### 3.1 Browser/Desktop App
1. Go to `vite.config.ts`
2. Update API proxy:
   ```typescript
   server: {
     proxy: {
       '/api': {
         target: process.env.VITE_API_URL || 'http://localhost:4777',
         changeOrigin: true,
       },
     },
   }
   ```

### 3.2 Rebuild and Deploy
```bash
npm run build
git add .
git commit -m "Update API endpoints for public deployment"
git push origin main
```

Railway automatically redeploys on push! 🎉

---

## 🔗 Step 4: Share with Friends

**URL to give to friends:**
```
https://lumyn-production.railway.app
```

Or if you created an Electron installer:
1. Rebuild with new API URL:
   ```bash
   npm run build:win
   ```
2. This creates a new .exe using the public API
3. Share the .exe file

---

## ✅ Verify Deployment

### Check Backend is Running
```bash
curl https://lumyn-production.railway.app/health
# Should return: { "status": "ok" }
```

### Check Socket.IO
Open browser console and verify connection to:
```
https://lumyn-production.railway.app/socket.io
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check MONGODB_URI is correct
- Make sure IP is whitelisted in MongoDB Atlas
- In Atlas: Network Access → Add 0.0.0.0/0 (allow all IPs)

### "CORS errors"
- Verify SOCKET_IO_CORS_ORIGIN=* in Railway env vars
- Check VITE_API_URL matches your Railway domain

### "Port 8080 not available"
- Railway automatically handles this
- Check Railway logs for errors

### "Railway deployment fails"
- Check Railway logs: go to Deployments → Recent
- Verify all env variables are set
- Ensure package.json has correct start script

---

## 📊 Monitoring

### View Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View live logs
railway logs
```

### Monitor Database
- MongoDB Atlas Dashboard shows:
  - Storage used (free tier: 512MB)
  - Number of operations
  - Slow queries

---

## 🎯 Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Set up MongoDB Atlas
3. ✅ Test with friends
4. Share .exe installer or web link
5. Celebrate! 🎉

---

## 💰 Costs (After Free Tier)

| Service | Free Tier | Paid |
|---------|-----------|------|
| **MongoDB Atlas** | 512MB storage | $3/month (2GB) |
| **Railway** | 500 GB-hours/month | Pay-as-you-go (~$5-10) |
| **Total** | FREE! | ~$8-13/month |

---

## 🔐 Security Notes

- Never commit `.env` with real credentials to GitHub
- Use Railway secrets instead
- Rotate JWT_SECRET periodically
- Keep MongoDB password strong
- Whitelist only necessary IPs in MongoDB Atlas

---

Good luck! Your LUMYN is now **live on the internet**! 🚀
