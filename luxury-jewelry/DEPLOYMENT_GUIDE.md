# Deployment Guide - Maison Luxury Jewelry

## Overview
This guide provides step-by-step instructions for deploying the Maison luxury jewelry frontend to production environments.

## Prerequisites

### Required
- Node.js 18 or higher
- Backend API with RSA encryption endpoints (see Backend Setup)
- Vercel account (for recommended deployment) OR alternative hosting platform
- Custom domain (optional but recommended)

### Backend API Requirements
Your backend must implement these endpoints:

1. **GET /api/crypto/key** - Returns RSA public key
2. **POST /api/process-payment** - Accepts encrypted payment data

See `README.md` for detailed endpoint specifications.

---

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended platform as it's built by the Next.js team and provides optimal performance.

#### Step 1: Prepare Repository
```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub, GitLab, or Bitbucket
git remote add origin <your-repo-url>
git push -u origin main
```

#### Step 2: Import to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Step 3: Environment Variables
Add the following environment variable in Vercel dashboard:

```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-api.com
```

**Important:** 
- Do NOT include trailing slash
- Must be HTTPS in production
- Must match CORS configuration on backend

#### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Vercel will provide a URL (e.g., `your-app.vercel.app`)

#### Step 5: Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

---

### Option 2: Netlify

#### Step 1: Build Configuration
Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Step 2: Deploy
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings (auto-detected from netlify.toml)
5. Add environment variable: `NEXT_PUBLIC_BACKEND_URL`
6. Click "Deploy site"

---

### Option 3: Self-Hosted (VPS)

For maximum control, deploy to your own server.

#### Requirements
- Ubuntu 20.04+ or similar Linux distro
- Nginx or Apache
- PM2 for process management
- SSL certificate (Let's Encrypt recommended)

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### Step 2: Deploy Application
```bash
# Clone repository
cd /var/www
sudo git clone <your-repo-url> maison
cd maison

# Install dependencies
sudo npm ci --production

# Create environment file
sudo nano .env.local
# Add: NEXT_PUBLIC_BACKEND_URL=https://your-backend-api.com

# Build application
sudo npm run build

# Start with PM2
sudo pm2 start npm --name "maison" -- start
sudo pm2 save
sudo pm2 startup
```

#### Step 3: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/maison
```

Add configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/maison /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: SSL Certificate
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com
```

---

## Backend Setup Guide

Your backend must implement the RSA encryption endpoints. Here's a reference implementation using Node.js/Express:

### Backend Example (Node.js)

```javascript
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));

// Generate RSA key pair (do this once, store securely)
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Endpoint 1: Return public key
app.get('/api/crypto/key', (req, res) => {
  res.json({ publicKey });
});

// Endpoint 2: Process payment
app.post('/api/process-payment', (req, res) => {
  try {
    const { ciphertext } = req.body;
    
    // Decrypt the payment data
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(ciphertext, 'base64')
    );
    
    const paymentData = JSON.parse(decrypted.toString());
    
    // Process payment with your payment gateway
    // This is where you'd integrate with Stripe, etc.
    console.log('Processing payment:', {
      amount: paymentData.amount,
      // Never log card details!
    });
    
    // Simulate successful payment
    const transactionId = 'txn_' + Date.now();
    
    res.json({
      success: true,
      transactionId
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(400).json({
      success: false,
      error: 'Payment processing failed'
    });
  }
});

app.listen(3001, () => {
  console.log('Backend running on port 3001');
});
```

---

## Post-Deployment Checklist

### Security
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured to allow only your frontend domain
- [ ] Environment variables set correctly
- [ ] RSA keys generated securely and stored safely
- [ ] No sensitive data in client-side code
- [ ] Content Security Policy headers configured

### Performance
- [ ] Images optimized and using Next.js Image component
- [ ] Lazy loading implemented where appropriate
- [ ] Build size analyzed (`npm run build`)
- [ ] Lighthouse score > 90 for all metrics

### Testing
- [ ] Test complete purchase flow in production
- [ ] Verify cart functionality across pages
- [ ] Test on multiple devices and browsers
- [ ] Confirm all product images load correctly
- [ ] Validate encryption/decryption works end-to-end

### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up analytics (Google Analytics, Plausible, etc.)
- [ ] Enable server-side logging
- [ ] Create backup strategy

---

## Troubleshooting

### Build Fails
**Error:** `Module not found: Can't resolve 'X'`  
**Solution:** Run `npm install` and ensure all dependencies in package.json

**Error:** `Type error in component`  
**Solution:** Run `npm run build` locally to catch TypeScript errors before deployment

### Runtime Errors

**Error:** `Failed to fetch public key`  
**Solution:** 
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Check backend is running and accessible
- Verify CORS headers on backend

**Error:** `Mixed Content blocked`  
**Solution:** 
- Ensure backend uses HTTPS
- Update `NEXT_PUBLIC_BACKEND_URL` to use HTTPS

**Error:** `Encryption failed`  
**Solution:**
- Verify public key format (must include BEGIN/END markers)
- Check JSEncrypt library is loaded correctly

### Performance Issues

**Slow page loads**  
**Solution:**
- Enable caching headers on server
- Use CDN for static assets
- Optimize images (WebP format, proper sizing)

**High memory usage**  
**Solution:**
- Increase Node.js memory limit: `NODE_OPTIONS=--max-old-space-size=4096`
- Review for memory leaks in components

---

## Scaling Considerations

### Traffic Growth
- **CDN:** Use Vercel Edge Network or Cloudflare
- **Caching:** Implement Redis for cart state if needed
- **Database:** Add PostgreSQL for order history
- **Load Balancing:** Use multiple backend instances

### Cost Optimization
- **Image Optimization:** Use next/image with remote patterns
- **Bundle Size:** Analyze with `@next/bundle-analyzer`
- **Serverless Functions:** Consider for API routes
- **Static Generation:** Use ISR for product pages

---

## Support & Maintenance

### Regular Updates
```bash
# Update dependencies monthly
npm outdated
npm update

# Rebuild and test
npm run build
npm start
```

### Security Patches
- Subscribe to GitHub security alerts
- Review npm audit regularly: `npm audit`
- Update Next.js when security patches released

### Backup Strategy
- Daily database backups (if using database)
- Weekly full system snapshots
- Git repository with all code changes
- Store RSA private key in secure vault (1Password, AWS Secrets Manager)

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Zustand State Management](https://github.com/pmndrs/zustand)

---

**Questions?** Contact the development team for assistance.
