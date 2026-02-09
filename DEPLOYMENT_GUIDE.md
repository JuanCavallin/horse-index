# Horse Index - Production Deployment Guide

## Prerequisites Completed ✅
- Backend code tested locally (npm test passing)
- Database migrations applied in Supabase
- RBAC and RLS policies configured
- Frontend ready for EAS builds
- EAS CLI installed

## Deployment Strategy

### Step 1: Deploy Backend to Render

**Why Render?** 
- Zero Docker knowledge needed (no containers required)
- Simple environment variables
- Automatic deploys from GitHub
- Free tier available for testing

**Steps:**
```bash
# 1. Commit backend changes to GitHub
cd /home/nrebo/Documents/hackathons/horse-index
git add .
git commit -m "Backend ready for production: RBAC, RLS, audit logging"
git push origin main

# 2. Create Render Service
# Go to https://dashboard.render.com
# Click "New +" > "Web Service"
# Connect GitHub repository: JuanCavallin/horse-index
# Fill form:
#   - Name: horse-index-backend
#   - Environment: Node
#   - Build Command: cd backend && npm install && npm run build
#   - Start Command: cd backend && npm start
#   - Environment Variables (from Supabase Dashboard):
#     SUPABASE_URL=<your-supabase-url>
#     SUPABASE_KEY=<your-service-role-key>
#     PORT=8000

# 3. Wait for deployment to complete (5-10 minutes)
# 4. Copy the deployment URL (e.g., https://horse-index-backend.onrender.com)
```

### Step 2: Update Frontend Configuration

```bash
# Update the API URL in frontend/.env
# Change EXPO_PUBLIC_API_URL to your Render backend URL
# Example: EXPO_PUBLIC_API_URL=https://horse-index-backend.onrender.com
```

### Step 3: Configure EAS Credentials

```bash
# From frontend directory
cd frontend

# Login to Expo account (create free account at expo.dev if needed)
eas login

# Configure for your Expo account
eas build:configure
```

### Step 4: Build for Production

```bash
# Build for Android (APK)
eas build --platform android --type apk

# Build for iOS (IPA - requires Mac or Render Mac machine)
eas build --platform ios --type ipa

# Monitor builds
eas build:list
```

## Environment Variables Reference

### Backend (.env)
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-service-role-key>
PORT=8000
```

### Frontend (.env)
```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
EXPO_PUBLIC_API_URL=https://horse-index-backend.onrender.com
```

**Where to find these values:**
- Supabase URL & Keys: Project Settings → API in Supabase Dashboard
- Service Role Key: Settings → API → Service role (SECRET - never commit or share)
- Anon Key: Settings → API → Public (safe for client-side use)

## Testing Deployed Backend

```bash
# Once Render deployment is live
curl https://horse-index-backend.onrender.com/ping
# Expected response: {"message":"Backend is alive!"}
```

## Post-Deployment Validation

1. ✅ Backend responds to ping
2. ✅ Authentication works (token validation)
3. ✅ Database connections active
4. ✅ RBAC enforced (admin-only endpoints)
5. ✅ Audit logging operational
6. ✅ File uploads functional

## Rollback Plan

If issues occur:
1. Render: Redeploy from previous deployment
2. Frontend: Rebuild with previous app version via EAS
3. Database: Supabase has automatic backups

## Support Links

- Render Docs: https://render.com/docs
- EAS Docs: https://docs.expo.dev/eas
- Supabase: https://supabase.com/docs
- Expo Go: https://expo.dev/download (for testing)

## Next Steps After Deployment

1. **Install on devices**: Download APK or use TestFlight for iOS
2. **Create users**: Register test users in frontend app
3. **Validate RBAC**: Test admin/editor/viewer permissions
4. **Monitor logs**: Check Render dashboard for errors
5. **Collect feedback**: Test with real users
6. **Iterate**: Update code and redeploy as needed
