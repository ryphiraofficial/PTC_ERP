# 🚀 Production Deployment Guide: Vercel (Frontend) & Render (Backend)

This document provides step-by-step instructions for deploying **Ledgerly** into production.

---

## Part 1: Deploy Backend on Render

### Step 1: Push Project to GitHub
Initialize your git repository (if not already done) and push to GitHub:
```bash
git init
git add .
git commit -m "Production ready Ledgerly GST Billing Suite"
git remote add origin https://github.com/your-username/ledgerly.git
git branch -M main
git push -u origin main
```

### Step 2: Create Web Service on Render
1. Log in to [Render.com](https://render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name**: `ledgerly-backend` (or your preferred name)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred tier)

### Step 3: Add Environment Variables on Render
Under **Environment Variables**, add:
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render assigns this automatically)
- `MONGODB_URI` = Your MongoDB Atlas connection string:
  ```
  mongodb+srv://<username>:<password>@cluster0.mongodb.net/ledgerly_gst?retryWrites=true&w=majority
  ```
- `JWT_SECRET` = A strong random secret key (e.g., `ledgerly_prod_jwt_secure_key_2026`)
- `CLIENT_URL` = Your Vercel frontend URL (e.g., `https://ledgerly.vercel.app` or `*`)

*(Note: On first startup, the server automatically initializes default users: Owner, Biller, CA and company data)*

### Step 4: Copy Your Backend URL
Once Render finishes deploying, copy your backend URL, for example:
`https://ledgerly-backend.onrender.com`

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Import Project to Vercel
1. Log in to [Vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Select your `ledgerly` GitHub repository.

### Step 2: Configure Project Settings
- **Project Name**: `ledgerly`
- **Framework Preset**: `Vite`
- **Root Directory**: Click **Edit** and select **`client`**
- **Build Command**: `npm run build` (detected automatically)
- **Output Directory**: `dist` (detected automatically)
- **Install Command**: `npm install`

### Step 3: Set Environment Variable
Expand **Environment Variables** and add:
- **Key**: `VITE_API_URL`
- **Value**: `https://ledgerly-backend.onrender.com` *(use your actual Render backend URL from Part 1)*

### Step 4: Deploy
Click **Deploy**.
Vercel will build the frontend. The included `client/vercel.json` ensures all SPA routes (`/invoices`, `/invoices/new`, `/invoices/:id/edit`, `/reports`, `/settings`) work directly without 404 errors on page reloads.

---

## 🔒 Post-Deployment Checklist

1. Update the `CLIENT_URL` on Render with your final Vercel domain (e.g. `https://your-ledgerly-app.vercel.app`) for strict CORS security.
2. Log in using default credentials:
   - **Owner**: `owner@ledgerly.app` / `password123`
   - **Biller**: `biller@ledgerly.app` / `password123`
   - **CA**: `ca@ledgerly.app` / `password123`
3. Update business credentials (Legal Name, GSTIN, Bank details & UPI ID) in **Settings**.
