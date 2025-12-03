# Fix Clerk CAPTCHA/Bot Protection Issue

## Problem
Cloudflare Turnstile CAPTCHA is failing during sign-up/sign-in, blocking users from creating accounts.

**Error:** 401 error from `challenges.cloudflare.com` - CAPTCHA verification failing

---

## ✅ Solution 1: Disable Bot Protection (Development)

**For testing and development, disable bot protection in Clerk dashboard:**

### Steps:

1. **Go to Clerk Dashboard**
   - Visit: https://dashboard.clerk.com

2. **Select Your Application**
   - Click on your "vital-bird-63" application

3. **Navigate to Settings**
   - Click "User & Authentication" in sidebar
   - Click "Attack Protection"

4. **Disable Bot Protection**
   - Find "Bot sign-up protection"
   - **Turn it OFF** for development
   - Save changes

5. **Test Again**
   - Clear browser cache (Ctrl + Shift + Delete)
   - Try signing up again
   - CAPTCHA should no longer appear

---

## ✅ Solution 2: Add Localhost to Allowed Domains

If you want to keep bot protection enabled:

1. **Clerk Dashboard** → Your App → **Domains**
2. Add `localhost` to allowed domains
3. Add `http://localhost:5173` to authorized redirects

---

## ✅ Solution 3: Use Production Domain (For Production)

For production deployment:

1. Configure your production domain in Clerk
2. Bot protection will work correctly on production domains
3. Turnstile CAPTCHA loads properly on public domains

---

## 🔧 Quick Fix Script

If you want to temporarily bypass CAPTCHA in development, you can use Clerk's test mode:

### In Clerk Dashboard:
1. Settings → **Environment**
2. Use **Development** instance (not Production)
3. Development instance has relaxed bot protection

---

## ⚡ Immediate Action

**Run these steps now:**

1. **Open Clerk Dashboard**: https://dashboard.clerk.com
2. **Go to**: User & Authentication → Attack Protection
3. **Toggle OFF**: "Bot sign-up protection"
4. **Save**
5. **Test**: Try signing up at http://localhost:5173/sign-up

---

## 📝 Notes

- **Development**: Disable bot protection for easier testing
- **Production**: Re-enable bot protection for security
- **Turnstile**: Cloudflare's CAPTCHA service used by Clerk
- **Test Keys**: Development keys have limitations with CAPTCHA

---

## 🎯 Expected Result

After disabling bot protection:
- ✅ No CAPTCHA challenge
- ✅ Immediate sign-up/sign-in
- ✅ No 401 errors
- ✅ Smooth user experience
