# Frontend Deployment Guide (Vercel)

## Quick Deploy

1. **Push to GitHub** (if not already done)

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `luxury-jewelry` directory

3. **Set Environment Variable**:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
   ```
   (Replace with your actual Render backend URL)

4. **Deploy**: Click "Deploy"

## Environment Variables

Required:
- `NEXT_PUBLIC_BACKEND_URL` - Your Render backend URL

## Post-Deployment

1. Update backend `FRONTEND_ORIGIN` to your Vercel URL
2. Test the full payment flow
3. Verify RSA encryption is working

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update backend `FRONTEND_ORIGIN` to match

