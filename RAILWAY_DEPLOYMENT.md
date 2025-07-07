# Railway Deployment Guide - SyndicApp

## 🚀 Deploying to Railway

### Step 1: Connect Your Repository
1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select the `syndicapp` repository

### Step 2: Add MySQL Database
1. In your Railway project, click "New"
2. Select "Database" → "MySQL"
3. Wait for the database to be provisioned

### Step 3: Configure Environment Variables

#### For the Backend Service:
Add these environment variables in your Railway project settings:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `JWT_SECRET` | `your_very_secure_jwt_secret_here` | JWT signing secret |
| `PORT` | `5050` | Backend port (Railway will override this) |

#### For the MySQL Database:
Railway automatically provides these variables - you need to set:

| Variable | Value | Description |
|----------|-------|-------------|
| `MYSQL_DATABASE` | `syndicapp` | Database name |
| `MYSQLDATABASE` | `syndicapp` | Alternative database name |

### Step 4: Configure Service Settings

#### Backend Service:
1. Set the **Root Directory** to `backend`
2. Set the **Build Command** to: `npm install`
3. Set the **Start Command** to: `npm start`

#### Frontend Service (Optional):
If you want to deploy the frontend separately:
1. Create another service from the same repository
2. Set **Root Directory** to `frontend`
3. Set **Build Command** to: `npm install && npm run build`
4. Set **Start Command** to: `npm run preview`

### Step 5: Database Migration

After deployment, you'll need to run database migrations. You can do this via Railway's shell:

1. Go to your backend service in Railway
2. Click on "Deployments" tab
3. Click on the latest deployment
4. Click "View Logs" → "Shell"
5. Run these commands:

```bash
# Install sequelize-cli globally
npm install -g sequelize-cli

# Run migrations
npx sequelize-cli db:migrate

# Create admin user
node scripts/createAdmin.js
```

### Step 6: Update Frontend Configuration

If you're deploying the frontend separately, update the API base URL:

```typescript
// frontend/src/api/axios.ts
const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-service-url.railway.app' 
  : 'http://localhost:5050';
```

### Step 7: Domain Configuration

1. Go to your backend service settings
2. Click "Generate Domain" or add a custom domain
3. Update your frontend API configuration with the new domain

## 🔧 Railway-Specific Configuration

### Database Connection
The application is configured to automatically use Railway's MySQL environment variables:
- `MYSQL_URL` - Complete connection string
- `MYSQLHOST` - Database host
- `MYSQLUSER` - Database username
- `MYSQLPASSWORD` - Database password
- `MYSQLDATABASE` - Database name
- `MYSQLPORT` - Database port

### Environment Detection
The app automatically detects Railway deployment and uses the appropriate configuration:
- Development: Uses local MySQL configuration
- Production: Uses Railway's MySQL environment variables

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check that all MySQL environment variables are set
   - Verify the database service is running
   - Check the logs for connection errors

2. **Migrations Not Running**
   - Ensure `NODE_ENV=production` is set
   - Run migrations manually via Railway shell
   - Check that the database user has proper permissions

3. **Frontend Can't Connect to Backend**
   - Verify the backend service URL is correct
   - Check CORS configuration
   - Ensure the backend service is running

4. **JWT Authentication Issues**
   - Verify `JWT_SECRET` is set
   - Check that the secret is consistent across deployments

### Logs and Monitoring:
- Use Railway's built-in logging to debug issues
- Monitor the deployment logs for any errors
- Check the service health status

## 📊 Post-Deployment

### Verify Deployment:
1. Check that all services are running (green status)
2. Test the API endpoints
3. Verify database connections
4. Test user authentication
5. Check that the dashboard loads correctly

### Performance Monitoring:
- Monitor Railway's built-in metrics
- Check database connection pool usage
- Monitor API response times

## 🔄 Continuous Deployment

Railway automatically deploys when you push to your main branch. To set up:

1. Connect your GitHub repository
2. Railway will automatically detect changes
3. Each push triggers a new deployment
4. Monitor deployment status in Railway dashboard

## 💰 Cost Optimization

- Use Railway's free tier for development
- Monitor resource usage
- Scale down during low-usage periods
- Use Railway's sleep mode for development environments 