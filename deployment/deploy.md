# 🚀 SyndicApp Deployment Guide - Hostinger

## 📋 Prerequisites

1. **Hostinger Account** with:
   - Shared Hosting or VPS plan
   - MySQL database
   - Node.js support (VPS recommended)

2. **Domain Name** (optional but recommended)

## 🗄️ Database Setup

### 1. Create MySQL Database in Hostinger
1. Login to Hostinger Control Panel
2. Go to **Databases** → **MySQL Databases**
3. Create a new database:
   - Database name: `syndicapp_db`
   - Username: `syndicapp_user`
   - Password: `strong_password_here`
4. Note down the database credentials

### 2. Import Database Schema
1. Go to **phpMyAdmin**
2. Select your database
3. Import the SQL file from `database/schema.sql`

## 🔧 Backend Deployment (VPS Recommended)

### Option A: VPS Deployment (Recommended)

1. **Connect to VPS via SSH**
```bash
ssh root@your-server-ip
```

2. **Install Node.js and PM2**
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install MySQL
apt install mysql-server -y
```

3. **Upload Backend Files**
```bash
# Create app directory
mkdir -p /var/www/syndicapp
cd /var/www/syndicapp

# Upload your backend files here
# You can use SCP, SFTP, or Git
```

4. **Configure Environment**
```bash
# Copy production environment file
cp .env.production .env

# Edit with your actual database credentials
nano .env
```

5. **Install Dependencies and Start**
```bash
npm install
npm run build

# Start with PM2
pm2 start server.js --name "syndicapp-backend"
pm2 startup
pm2 save
```

6. **Configure Nginx (Reverse Proxy)**
```bash
# Install Nginx
apt install nginx -y

# Create Nginx config
nano /etc/nginx/sites-available/syndicapp
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/syndicapp-frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/syndicapp /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Option B: Shared Hosting (Limited)

If using shared hosting without Node.js support:

1. **Use External Backend Service**
   - Deploy backend to Railway, Render, or Heroku
   - Update frontend API URL accordingly

## 🌐 Frontend Deployment

### 1. Build Frontend
```bash
cd frontend
npm install
npm run build
```

### 2. Upload to Hostinger

#### Option A: File Manager
1. Go to **File Manager** in Hostinger
2. Navigate to `public_html`
3. Upload all files from `frontend/build/` folder

#### Option B: FTP/SFTP
```bash
# Upload build folder contents to public_html
scp -r build/* username@your-server:/home/username/public_html/
```

### 3. Configure Frontend Environment
Update `frontend/.env.production`:
```env
REACT_APP_API_URL=https://your-domain.com/api
```

## 🔒 SSL Certificate

1. **Enable SSL in Hostinger**
   - Go to **SSL** in Control Panel
   - Enable free SSL certificate
   - Force HTTPS redirect

2. **Update Environment Variables**
   - Ensure all URLs use `https://`
   - Update CORS settings in backend

## 📝 Final Configuration

### 1. Update Backend CORS
In `backend/app.js`:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-domain.com',
  credentials: true
}));
```

### 2. Test Deployment
1. Visit your domain
2. Test login functionality
3. Verify all features work
4. Check console for errors

## 🚨 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Regular backups
- [ ] Monitor logs

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Check CORS configuration in backend
   - Verify domain in environment variables

2. **Database Connection**
   - Verify database credentials
   - Check MySQL service status

3. **API Not Found**
   - Check Nginx configuration
   - Verify backend is running
   - Check PM2 status: `pm2 status`

4. **Build Errors**
   - Check Node.js version
   - Clear npm cache: `npm cache clean --force`

## 📞 Support

If you encounter issues:
1. Check Hostinger documentation
2. Review application logs
3. Test locally first
4. Contact Hostinger support

## 🎉 Success!

Your SyndicApp should now be live at `https://your-domain.com`! 