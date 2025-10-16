# 🔧 Render Environment Variables Setup

## 🔴 Critical Issue: Black Screen with Supabase Error

### The Problem

**Error in Browser Console**:
```
Uncaught Error: supabaseKey is required.
    at new tj (index-DPGzXYXI.js:353:31896)
```

**Root Cause**:
- `VITE_SUPABASE_KEY` environment variable is **NOT available during the build process**
- Vite embeds environment variables at **BUILD TIME**, not runtime
- When Vite builds, it replaces `import.meta.env.VITE_SUPABASE_KEY` with the actual value
- If the variable is not set during build, it becomes an empty string `''`
- The Supabase client throws an error because the key is empty

---

## ✅ Solution: Set Environment Variables in Render Dashboard

### Step 1: Go to Render Dashboard

1. Open https://dashboard.render.com
2. Click on your **skillmatch-resume** service
3. Click on **"Environment"** in the left sidebar

### Step 2: Add Required Environment Variables

Add these environment variables (click **"Add Environment Variable"** for each):

#### 1. VITE_SUPABASE_KEY (Required for Frontend)
```
Key: VITE_SUPABASE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWFoc2x5a291d3Zub3djYXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2NzU5NzcsImV4cCI6MjA1MjI1MTk3N30.YOUR_ACTUAL_KEY_HERE
```
**⚠️ IMPORTANT**: Replace with your actual Supabase anon key!

#### 2. DATABASE_URL (Required for Backend)
```
Key: DATABASE_URL
Value: postgresql://postgres.ynqahslykouwvnowcazp:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```
**⚠️ IMPORTANT**: Replace with your actual Supabase database URL!

#### 3. GEMINI_API_KEY (Required for AI Features)
```
Key: GEMINI_API_KEY
Value: AIzaSy...YOUR_ACTUAL_GEMINI_KEY
```
**⚠️ IMPORTANT**: Replace with your actual Gemini API key!

#### 4. NODE_ENV (Already Set)
```
Key: NODE_ENV
Value: production
```
This should already be set.

---

## 📋 How to Find Your Supabase Credentials

### Finding VITE_SUPABASE_KEY

1. Go to https://supabase.com/dashboard
2. Select your project: **ynqahslykouwvnowcazp**
3. Click **"Settings"** (gear icon) in the left sidebar
4. Click **"API"**
5. Under **"Project API keys"**, find **"anon public"**
6. Copy the key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Finding DATABASE_URL

1. In the same Supabase dashboard
2. Click **"Settings"** → **"Database"**
3. Scroll down to **"Connection string"**
4. Select **"URI"** tab
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your database password

---

## 🔄 Step 3: Trigger Manual Deploy

After adding all environment variables:

1. Click **"Manual Deploy"** button at the top
2. Select **"Clear build cache & deploy"**
3. Wait for the deployment to complete (~5-10 minutes)

---

## ✅ Verification

### During Build (Check Logs)

You should see:
```
🔨 Building application...
📝 Environment variables for build:
  - VITE_SUPABASE_KEY: eyJhbGciOi...
  - NODE_ENV: production

vite v7.1.7 building for production...
✓ 2181 modules transformed.
✓ built in 8s
```

### After Deployment

1. Open your deployed app URL
2. Open browser console (F12)
3. You should **NOT** see the Supabase error
4. The app should load normally

---

## 🐛 Troubleshooting

### Still Seeing "supabaseKey is required" Error?

**Check 1: Is the environment variable set?**
```bash
# In Render dashboard → Environment
# Verify VITE_SUPABASE_KEY is listed
```

**Check 2: Did you trigger a new build?**
- Environment variables are only embedded during build
- You MUST trigger a new deployment after adding variables
- Use "Clear build cache & deploy" to ensure fresh build

**Check 3: Is the key correct?**
- The key should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- It should be the **anon public** key, not the service role key
- Copy it exactly from Supabase dashboard (no extra spaces)

**Check 4: Check build logs**
```bash
# In Render dashboard → Logs
# Look for the build output
# You should see:
📝 Environment variables for build:
  - VITE_SUPABASE_KEY: eyJhbGciOi...
```

If you see:
```
⚠️  WARNING: VITE_SUPABASE_KEY is not set!
```
Then the environment variable is not available during build.

---

## 📊 Environment Variables Summary

| Variable | Type | Required | Used By | When Needed |
|----------|------|----------|---------|-------------|
| `VITE_SUPABASE_KEY` | Build + Runtime | ✅ Yes | Frontend | Build time (embedded in bundle) |
| `DATABASE_URL` | Runtime | ✅ Yes | Backend | Runtime only |
| `GEMINI_API_KEY` | Runtime | ✅ Yes | Backend | Runtime only |
| `NODE_ENV` | Build + Runtime | ✅ Yes | Both | Build + Runtime |

**Key Difference**:
- **`VITE_*` variables**: Embedded at BUILD TIME into the frontend bundle
- **Other variables**: Used at RUNTIME by the backend server

---

## 🎯 Why This Happens

### How Vite Handles Environment Variables

**During Development** (`npm run dev`):
```typescript
// In your code:
const key = import.meta.env.VITE_SUPABASE_KEY;

// Vite reads from .env file and provides it at runtime
// Works fine in development
```

**During Production Build** (`npm run build`):
```typescript
// In your code:
const key = import.meta.env.VITE_SUPABASE_KEY;

// Vite REPLACES this with the actual value:
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// If VITE_SUPABASE_KEY is not set during build:
const key = undefined; // or ""

// This gets bundled into index-DPGzXYXI.js
```

**At Runtime** (when user opens the app):
```javascript
// The bundled code already has the value embedded:
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// If it was empty during build, it stays empty:
const key = "";

// Supabase client throws error:
// "supabaseKey is required"
```

---

## 🔒 Security Note

**Is it safe to embed the Supabase anon key in the frontend bundle?**

✅ **YES** - The anon key is designed to be public:
- It's meant to be used in client-side code
- It has Row Level Security (RLS) policies to protect data
- It cannot access admin functions
- It's the same key you'd use in any frontend app

❌ **NEVER** embed the **service role key** in the frontend:
- The service role key bypasses RLS
- It should only be used on the backend
- Keep it secret in backend environment variables only

---

## 📝 Quick Checklist

Before deploying, ensure:

- [ ] `VITE_SUPABASE_KEY` is set in Render dashboard
- [ ] `DATABASE_URL` is set in Render dashboard
- [ ] `GEMINI_API_KEY` is set in Render dashboard
- [ ] `NODE_ENV` is set to `production`
- [ ] Triggered a new deployment with "Clear build cache & deploy"
- [ ] Checked build logs for environment variable confirmation
- [ ] Tested the deployed app in browser
- [ ] No Supabase errors in browser console

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ Build completes without warnings about missing `VITE_SUPABASE_KEY`
2. ✅ App loads without black screen
3. ✅ No "supabaseKey is required" error in console
4. ✅ Can navigate to different pages
5. ✅ Can sign up / sign in (if auth is enabled)
6. ✅ Can create and view resumes

---

## 🚀 Next Steps After Fixing

Once the environment variables are set and deployed:

1. **Test Authentication**:
   - Try signing up with a new account
   - Try signing in with existing account
   - Check if user data persists

2. **Test Resume Features**:
   - Create a new resume
   - Compile to PDF
   - Download PDF
   - Test AI optimization

3. **Monitor Logs**:
   - Check Render logs for any errors
   - Check browser console for any warnings

---

## 📞 Still Having Issues?

If you've followed all steps and still see errors:

1. **Share the exact error message** from browser console
2. **Share the build logs** from Render dashboard
3. **Verify environment variables** are actually set in Render
4. **Try a fresh deployment** with "Clear build cache & deploy"

The most common issue is forgetting to trigger a new deployment after adding environment variables!

