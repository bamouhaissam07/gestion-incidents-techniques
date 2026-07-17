# 🚀 Guide de déploiement en production

## 📋 Prérequis

### Environnement serveur
- **Node.js** >= 16.x LTS
- **MySQL** >= 8.0
- **PM2** ou **Docker** (recommandé)
- **Nginx** (reverse proxy)
- **SSL Certificate** (Let's Encrypt recommandé)

### Ressources recommandées
- **RAM** : 2 GB minimum, 4 GB recommandé
- **CPU** : 2 cores minimum
- **Stockage** : 20 GB minimum
- **Réseau** : Connexion stable avec bande passante suffisante

## 🔧 Configuration de production

### 1. Variables d'environnement

Créer un fichier `.env.production` :

```env
# Environnement
NODE_ENV=production
PORT=3000

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=incidents_user
DB_PASSWORD=STRONG_SECURE_PASSWORD_HERE
DB_NAME=gestion_incidents_prod

# JWT (Générer une clé forte)
JWT_SECRET=VOTRE_CLE_SECRETE_JWT_TRES_FORTE_64_CARACTERES_MINIMUM
JWT_EXPIRE=24h

# Email (Production)
EMAIL_HOST=smtp.votre-domaine.com
EMAIL_PORT=587
EMAIL_USER=noreply@votre-domaine.com
EMAIL_PASS=EMAIL_PASSWORD
EMAIL_FROM=Gestion Incidents <noreply@votre-domaine.com>

# Sécurité
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logs
LOG_LEVEL=error
LOG_FILE_PATH=/var/log/gestion-incidents/app.log
```

### 2. Configuration de la base de données

#### Création de l'utilisateur MySQL
```sql
CREATE USER 'incidents_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
CREATE DATABASE gestion_incidents_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON gestion_incidents_prod.* TO 'incidents_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Optimisations MySQL
```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
max_connections = 200
query_cache_size = 32M
```

### 3. Configuration Nginx

```nginx
# /etc/nginx/sites-available/gestion-incidents
server {
    listen 80;
    server_name api.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.votre-domaine.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.votre-domaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy configuration
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /api/health {
        access_log off;
        proxy_pass http://127.0.0.1:3000;
    }
}
```

## 🐳 Déploiement avec Docker

### 1. Dockerfile
```dockerfile
FROM node:18-alpine

# Créer le répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apk add --no-cache dumb-init

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances en production
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Changer les permissions
RUN chown -R appuser:nodejs /app
USER appuser

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["dumb-init", "node", "server.js"]
```

### 2. docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mysql
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/my.cnf:/etc/mysql/conf.d/my.cnf
    ports:
      - "3306:3306"
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  mysql_data:

networks:
  app-network:
    driver: bridge
```

## 📦 Déploiement avec PM2

### 1. Configuration PM2
```json
{
  "apps": [{
    "name": "gestion-incidents-api",
    "script": "server.js",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production",
      "PORT": 3000
    },
    "log_file": "/var/log/gestion-incidents/combined.log",
    "out_file": "/var/log/gestion-incidents/out.log",
    "error_file": "/var/log/gestion-incidents/error.log",
    "time": true,
    "max_memory_restart": "1G",
    "node_args": "--max-old-space-size=1024"
  }]
}
```

### 2. Scripts de déploiement
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Démarrage du déploiement..."

# Variables
APP_NAME="gestion-incidents-api"
APP_DIR="/opt/gestion-incidents"
BACKUP_DIR="/backups/gestion-incidents"

# Sauvegarde de la base de données
echo "📦 Sauvegarde de la base de données..."
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/backup-$(date +%Y%m%d_%H%M%S).sql

# Arrêter l'application
echo "⏸️  Arrêt de l'application..."
pm2 stop $APP_NAME || true

# Mise à jour du code
echo "📥 Mise à jour du code..."
cd $APP_DIR
git pull origin main

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm ci --production

# Migration de la base de données si nécessaire
echo "🗄️  Migration de la base de données..."
npm run migrate || true

# Redémarrage de l'application
echo "🔄 Redémarrage de l'application..."
pm2 start ecosystem.config.js
pm2 save

# Vérification de la santé
echo "🏥 Vérification de la santé..."
sleep 5
curl -f http://localhost:3000/api/health || exit 1

echo "✅ Déploiement terminé avec succès!"
```

## 📊 Monitoring et logs

### 1. Configuration des logs
```javascript
// config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: '/var/log/gestion-incidents/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: '/var/log/gestion-incidents/combined.log'
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 2. Monitoring avec PM2
```bash
# Installer PM2 Plus pour le monitoring
pm2 plus

# Surveillance des métriques
pm2 monit

# Logs en temps réel
pm2 logs gestion-incidents-api

# Redémarrage automatique
pm2 startup
pm2 save
```

## 🔒 Sécurité en production

### 1. Pare-feu (UFW)
```bash
# Autoriser SSH
ufw allow ssh

# Autoriser HTTP/HTTPS
ufw allow 80
ufw allow 443

# Autoriser MySQL seulement localement
ufw allow from 127.0.0.1 to any port 3306

# Activer le pare-feu
ufw enable
```

### 2. SSL avec Let's Encrypt
```bash
# Installation de Certbot
sudo apt install certbot python3-certbot-nginx

# Génération du certificat
sudo certbot --nginx -d api.votre-domaine.com

# Auto-renouvellement
sudo crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Durcissement du système
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des outils de sécurité
sudo apt install fail2ban unattended-upgrades

# Configuration de fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📈 Optimisations de performance

### 1. Configuration Node.js
```bash
# Variables d'environnement pour Node.js
export UV_THREADPOOL_SIZE=16
export NODE_OPTIONS="--max-old-space-size=2048"
```

### 2. Cache Redis (optionnel)
```yaml
# docker-compose.yml (ajouter)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
```

## 🔄 Sauvegarde et restauration

### 1. Script de sauvegarde automatique
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/gestion-incidents"
DATE=$(date +%Y%m%d_%H%M%S)

# Sauvegarde base de données
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Sauvegarde fichiers de configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /opt/gestion-incidents/.env.production

# Nettoyage des anciennes sauvegardes (> 30 jours)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Sauvegarde terminée : $DATE"
```

### 2. Crontab pour sauvegardes automatiques
```bash
# Sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/scripts/backup.sh >> /var/log/gestion-incidents/backup.log 2>&1
```

## 🚨 Plan de récupération d'urgence

### 1. Procédure de rollback
```bash
#!/bin/bash
# rollback.sh

echo "🔄 Rollback en cours..."

# Arrêter l'application
pm2 stop gestion-incidents-api

# Restaurer le code
git reset --hard HEAD~1

# Restaurer les dépendances
npm ci --production

# Restaurer la base si nécessaire
# mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < /backups/latest.sql

# Redémarrer
pm2 start gestion-incidents-api

echo "✅ Rollback terminé"
```

### 2. Surveillance de la santé
```bash
#!/bin/bash
# health-check.sh

HEALTH_URL="https://api.votre-domaine.com/api/health"

if ! curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "❌ API indisponible - Redémarrage..."
    pm2 restart gestion-incidents-api
    
    # Notification (Slack, email, etc.)
    # curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"API Gestion Incidents redémarrée"}' \
    #   $SLACK_WEBHOOK_URL
fi
```

Ce guide couvre les aspects essentiels du déploiement en production. Adaptez les configurations selon vos besoins spécifiques et votre infrastructure.