# SyndicApp Frontend

This is the frontend for SyndicApp, a property management dashboard.

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the `frontend/` directory:

```
VITE_API_URL=https://syndic-production.up.railway.app
```

Or copy the example:
```bash
cp .env.example .env
```

### 3. Development
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
npm run preview
```

## 🚀 Deploying to Railway
1. Add a new service in Railway and select the `frontend/` folder as the root directory.
2. Set the build command:
   ```
   npm install && npm run build
   ```
3. Set the start command:
   ```
   npm run preview
   ```
4. Add the environment variable:
   - `VITE_API_URL=https://syndic-production.up.railway.app`
5. Deploy!

## 🌐 API URL
- The frontend will use the backend deployed at: `https://syndic-production.up.railway.app`

## 📝 License
MIT
