# MongoDB Setup for LUMYN Cloud Messenger

LUMYN has been upgraded to use MongoDB for cloud data storage, enabling multi-device sync and cross-network messaging.

## Quick Setup Options

### Option 1: MongoDB Atlas (Recommended for Cloud Messenger)

MongoDB Atlas is a free cloud database service - perfect for a messenger app.

1. **Create Free Account**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account
   - Create a new cluster (M0 Free tier - 512MB storage)

2. **Get Connection String**
   - In Atlas dashboard, click "Connect"
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)

3. **Configure LUMYN**
   - Open `server/.env` file
   - Replace `MONGODB_URI` with your Atlas connection string:
     ```
     MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/lumyn
     ```
   - Make sure to replace `your_username` and `your_password` with your actual credentials

4. **Whitelist IP Address**
   - In Atlas, go to Network Access
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (or add your specific IP)

### Option 2: Local MongoDB (For Development)

If you want to run MongoDB locally on your machine:

1. **Install MongoDB Community Edition**
   - Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - Run the installer (Windows: MSI installer)
   - During installation, select "Install MongoDB as a Service"

2. **Verify Installation**
   ```powershell
   mongod --version
   ```

3. **Start MongoDB Service**
   ```powershell
   net start MongoDB
   ```

4. **Configure LUMYN**
   - The `.env` file already has the local connection:
     ```
     MONGODB_URI=mongodb://localhost:27017/lumyn
     ```

## Migration from JSON Storage

If you have existing users in `disgram.auth.json`, run the migration script:

```powershell
cd server
node migrate.js
```

This will:
- ✓ Migrate all users to MongoDB
- ✓ Migrate sessions
- ✓ Migrate friendships and friend requests
- ✓ Migrate chat data
- ✓ Preserve all existing data

⚠️ **Backup Recommendation**: Before migrating, backup your `disgram.auth.json` file.

## Starting the Server

Once MongoDB is configured:

```powershell
# Development mode
npm run server

# Or directly
node server/index.js
```

You should see:
```
✓ Connected to MongoDB
Auth server running on http://localhost:4777
MongoDB connected successfully
```

## Verification

Test MongoDB connection:

```powershell
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✓ MongoDB connected!'); process.exit(0); }).catch(err => { console.error('✗ Connection failed:', err.message); process.exit(1); });"
```

## What Changed?

### Before (v0.1.5)
- Local JSON file storage (`disgram.auth.json`)
- Single machine only
- No multi-device sync
- Limited to same network

### After (v0.2.0 - Cloud Edition)
- ✅ MongoDB cloud storage
- ✅ Multi-device synchronization
- ✅ Cross-network messaging
- ✅ Real-time message persistence
- ✅ Scalable architecture
- ✅ Ready for deployment (Render.com)

## Troubleshooting

### Connection Failed
- Check your MongoDB service is running: `net start MongoDB` (local)
- Verify `.env` has correct `MONGODB_URI`
- For Atlas: check network access whitelist

### Migration Issues
- Ensure `disgram.auth.json` exists
- Check MongoDB connection before running migration
- Check console output for specific errors

### ECONNREFUSED Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
- **Local MongoDB**: Start the MongoDB service
- **Atlas**: Double-check connection string in `.env`

## Next Steps

After MongoDB is working:

1. ✅ Test registration and login
2. ✅ Test sending messages
3. ✅ Test friend requests
4. 🔄 Deploy to Render.com (for cloud hosting)
5. 🔄 Update desktop app to use cloud API

## Support

For issues:
1. Check MongoDB connection string format
2. Verify network access (Atlas)
3. Check server console for error messages
4. Ensure all npm packages are installed: `npm install`

---

**Cloud messenger ready!** 🚀
