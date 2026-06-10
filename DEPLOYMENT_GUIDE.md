# Clinic Management System - Deployment Guide

This guide describes how to deploy the Clinic Management System in a production environment using Docker Compose.

---

## 🏗️ Production Deployment Architecture

The system utilizes Docker Compose to orchestrate three core services:
1. **`db`**: A PostgreSQL 15 database instance persisting data inside a Docker volume.
2. **`backend`**: The NestJS application running on port `3001` inside Alpine Node container.
3. **`frontend`**: The Next.js application running on port `3000` inside Alpine Node container.

---

## 📋 Step-by-Step Deployment

### Step 1: Clone the Repository to the Server
SSH into your production VPS and clone the project:
```bash
git clone <your-repo-url> /var/www/clinic-system
cd /var/www/clinic-system
```

### Step 2: Configure Environment Variables

Create the database configuration `.env` file inside the `backend` folder:
```bash
nano backend/.env
```
Add the production parameters:
```env
DATABASE_URL="postgresql://postgres:SecureAdminPassword123!@db:5432/clinic_db?schema=public"
PORT=3001
JWT_SECRET="generate-a-long-random-string-here"
```

Create the frontend configurations:
```bash
nano frontend/.env.local
```
Add the backend API endpoint URL:
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
```

### Step 3: Run the Orchestrated Docker Stack
Launch the containers in detached mode:
```bash
docker compose up -d
```
This command will:
1. Initialize the PostgreSQL container.
2. Build/pull the NestJS backend, run Prisma `db push` to align the schema, execute the roles/specialty seeding scripts automatically, and launch the server.
3. Build/pull the Next.js frontend and serve it.

---

## 🔒 Securing the App with Nginx (Reverse Proxy & SSL)

For production, expose your app securely over HTTPS. Install Nginx and certbot:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Nginx Configuration File
Create a new configuration:
```bash
sudo nano /etc/nginx/sites-available/clinic-system
```

Add the server blocks:
```nginx
# 1. Frontend Client Configuration
server {
    server_name clinic.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 2. Backend API Configuration
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase upload limit for clinical file assets
        client_max_body_size 10M;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/clinic-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Configuration
Obtain and configure Let's Encrypt certificates:
```bash
sudo certbot --nginx -d clinic.yourdomain.com -d api.yourdomain.com
```
Follow the interactive prompts to enable automated redirects from HTTP to HTTPS.

---

## 💾 Database Backups

It is crucial to back up your PostgreSQL database regularly. Set up a simple cron job to create daily SQL backups.

Create a backup script:
```bash
mkdir -p ~/backups
nano ~/backups/db_backup.sh
```

Add the backup command:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DB_CONTAINER_NAME="clinic-system-db-1"
DATE=$(date +%Y-%m-%d_%H%M%S)

docker exec -t $DB_CONTAINER_NAME pg_dumpall -U postgres > "$BACKUP_DIR/clinic_db_backup_$DATE.sql"

# Remove backups older than 30 days
find $BACKUP_DIR -type f -name "*.sql" -mtime +30 -delete
```

Make the script executable and add to crontab:
```bash
chmod +x ~/backups/db_backup.sh
crontab -e
```
Add the following line to run backups every night at 2:00 AM:
```text
0 2 * * * /home/ubuntu/backups/db_backup.sh >/dev/null 2>&1
```
