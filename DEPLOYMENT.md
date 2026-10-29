# Vercel Deployment Guide

This guide explains how to deploy the SellerMath application with an Express backend to Vercel.

## Architecture

The application uses a **monorepo architecture** where:
- React frontend is built with Vite
- Express backend (`server.js`) serves API endpoints
- Vercel routes `/api/*` requests to the Express server
- All other requests serve the React frontend

## Files Modified for Vercel

### 1. `vercel.json`
This file configures Vercel to route API requests to the Express server:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/server.js"
    }
  ]
}
```

### 2. `server.js`
Modified to export the Express app for Vercel:
```javascript
// For Vercel serverless deployment
export default app;

// For local development
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`SellerMath API listening on http://localhost:${PORT}`);
  });
}
```

### 3. `src/lib/calculateApi.ts`
The API base URL uses relative paths by default for Vercel:
```typescript
const API_BASE = import.meta.env.VITE_API_URL ?? '';
```

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (or select existing)
- **Project name** → `sellermath` (or your preferred name)
- **Directory** → `./` (current directory)
- **Override settings?** → No

4. **Production Deployment**:
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Deploy"

## Environment Variables

### For Local Development
Create a `.env` file in the project root:
```env
VITE_API_URL=http://localhost:3001
```

### For Vercel Deployment
- No environment variables needed for the API
- The `vercel.json` configuration handles routing automatically
- `VITE_API_URL` can be left empty to use relative paths

### Adding Environment Variables in Vercel Dashboard
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add any needed variables (e.g., database URLs, API keys)

## Local Development

### Start the Backend Only
```bash
npm run server
```
The API will be available at `http://localhost:3001`

### Start the Frontend Only
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`

### Start Both (Recommended for Local Dev)
Open two terminal windows:
- Terminal 1: `npm run server`
- Terminal 2: `npm run dev`

Set `VITE_API_URL=http://localhost:3001` in your `.env` file.

## API Endpoints

All endpoints are available under `/api`:

- `POST /api/calculate/universal` - Universal calculator
- `POST /api/calculate/amazon-fba` - Amazon FBA calculator
- `POST /api/calculate/flipkart` - Flipkart calculator
- `POST /api/calculate/meesho` - Meesho calculator
- `POST /api/calculate/roas` - ROAS calculator
- `POST /api/calculate/blinkit` - Blinkit calculator
- `GET /api/health` - Health check endpoint

## Rate Limiting

The API has rate limiting configured:
- **40 requests per minute per IP**
- Health check endpoint (`/api/health`) is exempt from rate limiting

## Troubleshooting

### API Returns 404 on Vercel
- Ensure `vercel.json` is in the project root
- Check that the rewrites configuration is correct
- Verify `server.js` exports the Express app: `export default app;`

### CORS Errors
- The Express server already has CORS enabled
- Ensure your frontend uses relative paths in production
- Check that API calls use `/api/` prefix

### Build Failures
- Ensure all dependencies are installed: `npm install`
- Check that `package.json` has the correct build script
- Verify Node.js version compatibility (Vercel uses Node.js 18+ by default)

### Local Development Issues
- Make sure the backend is running on port 3001
- Check that `.env` file has `VITE_API_URL=http://localhost:3001`
- Ensure both frontend and backend are using the same protocol (http/https)

## Alternative: Serverless Functions

If you prefer individual serverless functions instead of a single Express server, you can:

1. Create an `api/` directory structure:
```
api/
  index.js (main handler)
  calculate/
    universal.js
    amazon-fba.js
    flipkart.js
    etc.
```

2. Each file would export a handler function:
```javascript
export default function handler(req, res) {
  // Your calculation logic here
}
```

3. Remove `vercel.json` - Vercel automatically detects serverless functions

However, the current Express server approach is simpler and works well for this use case.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
