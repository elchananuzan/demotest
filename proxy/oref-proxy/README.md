# Oref API Proxy

Lightweight proxy deployed to **Google Cloud Functions in `me-west1` (Tel Aviv)** to bypass Oref API geo-restrictions.

## Why?

The Oref alert API only responds to Israeli IPs. Vercel servers are outside Israel, so production gets blocked. This proxy runs in GCP Tel Aviv and forwards requests.

## Endpoints

| Path | Upstream |
|------|----------|
| `/alerts` | `oref.org.il/warningMessages/alert/Alerts.json` |
| `/history` | `alerts-history.oref.org.il/.../GetAlarmsHistory.aspx` |

## Deploy to GCP

### Prerequisites

1. [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. A GCP project with billing enabled (free tier covers this)

### Steps

```bash
# Authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com

# Deploy (from this directory)
cd proxy/oref-proxy

gcloud functions deploy oref-proxy \
  --gen2 \
  --runtime nodejs20 \
  --region me-west1 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point orefProxy \
  --set-env-vars PROXY_API_KEY=YOUR_SECRET_KEY \
  --memory 128Mi \
  --timeout 30s
```

### After Deployment

1. Copy the function URL (shown in deploy output)
2. Add to Vercel environment variables:
   - `OREF_PROXY_URL` = `https://me-west1-YOUR_PROJECT.cloudfunctions.net/oref-proxy`
   - `OREF_PROXY_KEY` = the same secret key you set above
3. Redeploy Vercel

### Test

```bash
# Health check
curl https://me-west1-YOUR_PROJECT.cloudfunctions.net/oref-proxy?key=YOUR_SECRET_KEY

# Get alert history
curl https://me-west1-YOUR_PROJECT.cloudfunctions.net/oref-proxy/history?key=YOUR_SECRET_KEY
```

## Local Testing

```bash
PROXY_API_KEY=test node index.js
# Then: curl http://localhost:8080/history?key=test
```

## Cost

Free tier: 2M invocations/month, 400K GB-seconds. This proxy uses ~128MB and runs <1s per request, so effectively unlimited free usage.
