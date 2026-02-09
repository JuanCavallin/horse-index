# 🚀 Deployment Checklist

## Pre-Deployment Validation ✅

- ✅ Backend server running locally (npm run dev)
- ✅ All 10 unit tests passing (npm test)
- ✅ TypeScript compilation successful (npm run build)
- ✅ 11/11 pre-deployment integration tests passing
- ✅ RBAC enforcement verified
- ✅ Authentication working
- ✅ Database connectivity confirmed
- ✅ Code committed and pushed to GitHub

## Deployment Steps

### Step 1: Deploy Backend to Render (5-10 min)

1. Go to https://dashboard.render.com
2. Click **"New +" > "Web Service"**
3. Connect your GitHub repository: **JuanCavallin/horse-index**
4. Fill in the form:
   - **Name:** `horse-index-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
   - **Environment Variables:**
     - `SUPABASE_URL` = (from Supabase Dashboard > Settings > API)
     - `SUPABASE_KEY` = (from Supabase Dashboard > Settings > API > Service role key)
     - `PORT` = `8000`

5. Click "Create Web Service"
6. Wait for deployment to complete (~5 min)
7. Copy the deployment URL (e.g., `https://horse-index-backend.onrender.com`)

### Step 2: Update Frontend Configuration (2 min)

Update the API URL in `frontend/.env`:
```dotenv
EXPO_PUBLIC_API_URL=https://horse-index-backend.onrender.com
```

### Step 3: Build Mobile App with EAS (10-20 min)

From the `frontend` directory:

```bash
# First time only - login to Expo
eas login

# First time only - configure for your account
eas build:configure

# Build for Android (APK)
eas build --platform android --type apk

# OR Build for iOS (IPA) - requires TestFlight account
eas build --platform ios --type ipa

# Monitor builds
eas build:list
```

### Step 4: Test Deployed Backend

```bash
# Test the deployment
curl https://horse-index-backend.onrender.com/ping
# Expected: {"message":"Backend is alive!"}
```

## Environment Variables Reference

| Service | Variable | Value |
|---------|----------|-------|
| Backend | `SUPABASE_URL` | Project URL from Supabase |
| Backend | `SUPABASE_KEY` | Service role key (SECRET) |
| Frontend | `EXPO_PUBLIC_SUPABASE_URL` | Same as backend |
| Frontend | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon key (public) |
| Frontend | `EXPO_PUBLIC_API_URL` | Render backend URL |

## Testing Deployed System

### Test Backend
```bash
# Health check
curl https://horse-index-backend.onrender.com/ping

# Create test user (in app)
# Sign up with email/password

# Test RBAC
# Admin: Can delete horses
# Editor: Can create medical records
# Viewer: Read-only access
```

### Test Mobile App
1. Download APK or use TestFlight link (iOS)
2. Launch app
3. Sign up with email/password
4. Verify data loads from backend
5. Test role-based features

## Rollback Plan

If something goes wrong:

**Backend Issues:**
1. Go to Render dashboard
2. Click service > Deployments
3. Select previous deployment
4. Click "Redeploy"

**Mobile App Issues:**
1. Rebuild with `eas build`
2. Use EAS to push new release

**Database Issues:**
1. Supabase has automatic backups
2. Contact Supabase support for recovery

## Monitoring

- **Backend:** Check Render dashboard for logs
- **Database:** Monitor Supabase dashboard
- **Mobile:** Use Firebase Crashlytics or similar (optional)

## Support Resources

- Render Docs: https://render.com/docs
- EAS Docs: https://docs.expo.dev/eas
- Supabase: https://supabase.com/docs
- Expo Go: https://expo.dev/download (for testing)

## Success Indicators

✅ Backend responds to ping
✅ Authentication tokens issued
✅ Medical records visible in app
✅ Role-based access enforced
✅ Audit logs recording changes
✅ File uploads working
✅ Mobile app connecting to backend

---

**Status: READY FOR DEPLOYMENT** 🎉
