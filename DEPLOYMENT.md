# FlashGPT Deployment Guide

This guide covers how to deploy **FlashGPT** (Frontend & Backend) to production.

---

## 🚀 Option 1: Deploy on Vercel (Recommended)

You can deploy the client and server as two separate projects in Vercel from the same Git repository.

### Step 1: Deploy Backend (`server`)

1. Go to [Vercel Dashboard](https://vercel.com/new) and import your FlashGPT repository.
2. Under **Project Name**, set: `flashgpt-server`
3. Under **Root Directory**, click Edit and select: `server`
4. Expand **Environment Variables** and add all variables from `server/.env.example`:
   * `MONGODB_URI`: Your MongoDB Atlas URI
   * `JWT_SECRET`: A secure random string
   * `GEMINI_API_KEY`: Your Google Gemini API Key
   * `IMAGEKIT_PUBLIC_KEY`: ImageKit Public Key
   * `IMAGEKIT_PRIVATE_KEY`: ImageKit Private Key
   * `IMAGEKIT_URL_ENDPOINT`: ImageKit Endpoint URL
   * `STRIPE_PUBLISHABLE_KEY`: Stripe Publishable Key
   * `STRIPE_SECRET_KEY`: Stripe Secret Key
   * `STRIPE_WEBHOOK_SECRET`: Stripe Webhook Signing Secret
5. Click **Deploy**.
6. Note the deployed backend URL (e.g., `https://flashgpt-server.vercel.app`).

### Step 2: Deploy Frontend (`client`)

1. In Vercel, click **Add New... > Project** and import the same repository again.
2. Under **Project Name**, set: `flashgpt-client`
3. Under **Root Directory**, click Edit and select: `client`
4. Framework Preset: **Vite**
5. Expand **Environment Variables** and add:
   * `VITE_SERVER_URL`: `https://flashgpt-server.vercel.app` (the backend URL from Step 1)
6. Click **Deploy**.

### Step 3: Configure Stripe Webhook

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/webhooks).
2. Add endpoint: `https://flashgpt-server.vercel.app/api/stripe`
3. Select event to listen: `checkout.session.completed`
4. Copy the **Signing Secret** (`whsec_...`) and update `STRIPE_WEBHOOK_SECRET` in your backend environment variables in Vercel.

---

## 🌐 Option 2: Deploy Backend on Render / Railway

If you prefer a persistent Node.js server container:

1. Create a new **Web Service** on [Render](https://render.com/) or [Railway](https://railway.app/).
2. Set **Root Directory** to `server`.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add the environment variables from `server/.env.example`.
6. Deploy and use the generated URL as `VITE_SERVER_URL` in your frontend deployment.

---

## 🔒 MongoDB Atlas Configuration Checklist

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Navigate to **Security > Network Access**.
3. Ensure **Allow Access From Anywhere** (`0.0.0.0/0`) is added so Vercel and production cloud instances can connect.
4. Under **Security > Database Access**, verify your database user has read/write permissions.
