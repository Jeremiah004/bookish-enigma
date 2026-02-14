# Deployment Guide

This guide walks you through deploying the Secure Vault backend to Render and the frontend to Vercel.

## Prerequisites

- GitHub account (for connecting repositories)
- Render account (free tier available)
- Vercel account (free tier available)
- Node.js installed locally (for generating RSA keys)

## Part 1: Backend Deployment (Render)

### Step 1: Prepare RSA Keys

Before deploying, generate your RSA keys locally:

```bash
cd kreditkarte
npm install
npm run dev  # This will generate keys/private.pem and keys/public.pem
```

### Step 2: Get Key Content for Environment Variables

**Option A: Base64 Encode (Recommended for Render)**

```bash
# On Windows PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content keys/private.pem -Raw)))
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content keys/public.pem -Raw)))

# On Linux/Mac:
base64 -i keys/private.pem
base64 -i keys/public.pem
```

**Option B: Copy PEM Content Directly**

Copy the entire content of `keys/private.pem` and `keys/public.pem` (including BEGIN/END markers).

### Step 3: Deploy to Render

1. **Push code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create new Web Service on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository (`bookish-enigma` or your repo name)

3. **Configure Service**:
   - **Name**: `secure-vault-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Root Directory**: `kreditkarte` ⚠️ **IMPORTANT: Set this to `kreditkarte`**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free tier is fine for testing
   
   **Critical**: In the Render dashboard, under "Settings" → "Build & Deploy", make sure **Root Directory** is set to `kreditkarte`. This tells Render where to find the `package.json` file.

4. **Set Environment Variables** in Render dashboard:

   ```
   NODE_ENV=production
   PORT=10000
   
   # RSA Keys (choose one method)
   PRIVATE_KEY=<paste base64-encoded or full PEM content>
   PUBLIC_KEY=<paste base64-encoded or full PEM content>
   
   # OR use file paths (if using persistent disk)
   # PRIVATE_KEY_PATH=/opt/render/project/src/keys/private.pem
   # PUBLIC_KEY_PATH=/opt/render/project/src/keys/public.pem
   
   # Frontend URL (update after deploying frontend)
   FRONTEND_ORIGIN=https://your-frontend.vercel.app
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX=5
   
   # Session Header (optional)
   REQUIRE_SESSION_HEADER=true
   SESSION_HEADER_NAME=x-session-id
   
   # Database Path (SQLite)
   DATABASE_PATH=/opt/render/project/src/data/transactions.db
   ```

5. **Deploy**: Click "Create Web Service"

6. **Note your backend URL**: Render will provide a URL like `https://secure-vault-backend.onrender.com`

### Step 4: Verify Backend Deployment

- Health check: `https://your-backend.onrender.com/health`
- Public key: `https://your-backend.onrender.com/api/crypto/key`
- Should return `{ status: "ok" }` and `{ publicKey: "..." }` respectively

## Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. **Update backend URL** in your frontend code (if hardcoded):
   - The frontend already uses `NEXT_PUBLIC_BACKEND_URL` environment variable
   - No code changes needed

2. **Push to GitHub** (if not already done)

### Step 2: Deploy to Vercel

1. **Import Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the `luxury-jewelry` directory (or root if monorepo)

2. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `luxury-jewelry` (if monorepo)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

3. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
   ```
   (Replace with your actual Render backend URL)

4. **Deploy**: Click "Deploy"

5. **Note your frontend URL**: Vercel will provide a URL like `https://your-app.vercel.app`

### Step 3: Update Backend CORS

1. Go back to Render dashboard
2. Update `FRONTEND_ORIGIN` environment variable:
   ```
   FRONTEND_ORIGIN=https://your-app.vercel.app
   ```
3. Render will automatically redeploy

## Part 3: Database Access

### Accessing Transactions via API

Once deployed, you can access transactions:

- **List all**: `GET https://your-backend.onrender.com/api/transactions`
- **Get by ID**: `GET https://your-backend.onrender.com/api/transactions/:id`
- **Statistics**: `GET https://your-backend.onrender.com/api/admin/stats`
- **Filtered list**: `GET https://your-backend.onrender.com/api/transactions?startDate=2024-01-01&limit=10`

### Query Parameters

- `startDate`: ISO date string (e.g., `2024-01-01T00:00:00Z`)
- `endDate`: ISO date string
- `minAmount`: Minimum amount (number)
- `maxAmount`: Maximum amount (number)
- `limit`: Number of results (default: all)
- `offset`: Pagination offset

### Downloading Database File (Render)

1. Use Render's Shell feature to access the database
2. Or set up a backup script that exports to JSON/CSV via API

## Troubleshooting

### Backend Issues

- **Keys not loading**: Check environment variables are set correctly in Render
- **CORS errors**: Verify `FRONTEND_ORIGIN` matches your Vercel URL exactly
- **Database errors**: Check `DATABASE_PATH` is writable (use `/opt/render/project/src/data/`)

### Frontend Issues

- **"Security initialization failed" / "Payment Failed"**: This error occurs when the frontend cannot fetch the public key from the backend. Check:
  1. **Environment Variable**: In Vercel dashboard, verify `NEXT_PUBLIC_BACKEND_URL` is set to your Render backend URL (e.g., `https://your-backend.onrender.com`)
  2. **Backend URL Format**: Ensure the URL uses `https://` (not `http://`) and has no trailing slash
  3. **Backend Health**: Test the backend directly:
     - Health: `https://your-backend.onrender.com/health`
     - Public Key: `https://your-backend.onrender.com/api/crypto/key`
  4. **CORS Configuration**: In Render, verify `FRONTEND_ORIGIN` matches your Vercel URL exactly (including `https://`)
  5. **Backend Status**: Check Render dashboard to ensure the backend service is running (not sleeping)
  6. **Redeploy**: After fixing environment variables, redeploy both frontend and backend
- **Can't connect to backend**: Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly in Vercel environment variables
- **Encryption fails**: Ensure backend public key endpoint is accessible and returns valid key
- **Network errors**: Check browser console for detailed error messages - the improved error handling will show specific issues
- **"atob" / "Latin1 range" error**: This occurs when the public key contains invalid characters. Solutions:
  1. **Check backend key format**: Ensure `PUBLIC_KEY` in Render environment variables is properly formatted
  2. **If using base64 encoding**: Make sure the base64 string is valid and doesn't contain extra characters
  3. **If using PEM directly**: Ensure the PEM key has proper line breaks and no invisible Unicode characters
  4. **Regenerate keys**: If the issue persists, regenerate the RSA keys locally and re-encode them for environment variables
  5. **Check backend logs**: Look for any encoding errors when the backend loads the keys

## Security Notes

- **Never commit RSA keys** to git
- **Use environment variables** for all sensitive data
- **Enable HTTPS** (automatic on Render/Vercel)
- **Consider authentication** for admin endpoints in production
- **Regular backups**: Set up automated database backups

## Next Steps

- Set up monitoring/alerting
- Configure custom domains
- Set up automated backups
- Add authentication for admin endpoints
- Consider upgrading to paid tiers for better performance

