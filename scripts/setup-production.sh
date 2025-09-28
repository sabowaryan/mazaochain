#!/bin/bash

# Production Environment Setup Script for MazaoChain
# This script sets up the production environment on a fresh Ubuntu server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Check if required environment variables are set
check_env_vars() {
    log "Checking required environment variables..."
    
    required_vars=(
        "PRODUCTION_HOST"
        "PRODUCTION_USER"
        "DOMAIN_NAME"
        "EMAIL_ADDRESS"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    log "All required environment variables are set"
}

# Update system packages
update_system() {
    log "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
    sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    log "Docker installed successfully"
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js..."
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Install global packages
    sudo npm install -g pm2
    
    log "Node.js installed successfully"
}

# Setup firewall
setup_firewall() {
    log "Configuring firewall..."
    
    # Enable UFW
    sudo ufw --force enable
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow monitoring ports (restrict to localhost)
    sudo ufw allow from 127.0.0.1 to any port 9090  # Prometheus
    sudo ufw allow from 127.0.0.1 to any port 3001  # Grafana
    sudo ufw allow from 127.0.0.1 to any port 9093  # Alertmanager
    
    log "Firewall configured successfully"
}

# Setup SSL certificates with Let's Encrypt
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Install Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Create nginx configuration for domain verification
    sudo tee /etc/nginx/sites-available/mazaochain > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/mazaochain /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    # Obtain SSL certificate
    sudo certbot certonly --webroot -w /var/www/html -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME} --email ${EMAIL_ADDRESS} --agree-tos --non-interactive
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    log "SSL certificates configured successfully"
}

# Create application directory structure
setup_app_directory() {
    log "Setting up application directory..."
    
    # Create application directory
    sudo mkdir -p /opt/mazaochain
    sudo chown $USER:$USER /opt/mazaochain
    
    # Create required subdirectories
    mkdir -p /opt/mazaochain/{logs,backups,ssl}
    
    # Create log rotation configuration
    sudo tee /etc/logrotate.d/mazaochain > /dev/null <<EOF
/opt/mazaochain/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f /opt/mazaochain/deployment/production/docker-compose.yml restart mazaochain-app
    endscript
}
EOF
    
    log "Application directory structure created"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring directories
    mkdir -p /opt/mazaochain/monitoring/{prometheus,grafana,alertmanager}
    
    # Set proper permissions
    sudo chown -R 472:472 /opt/mazaochain/monitoring/grafana  # Grafana user
    sudo chown -R 65534:65534 /opt/mazaochain/monitoring/prometheus  # Nobody user
    
    log "Monitoring setup completed"
}

# Setup backup system
setup_backup() {
    log "Setting up backup system..."
    
    # Create backup directory
    sudo mkdir -p /var/backups/mazaochain
    sudo chown $USER:$USER /var/backups/mazaochain
    
    # Setup automated backups (daily at 2 AM)
    (crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/mazaochain && npm run backup-db") | crontab -
    
    # Setup backup cleanup (weekly)
    (crontab -l 2>/dev/null; echo "0 3 * * 0 find /var/backups/mazaochain -name '*.gz' -mtime +30 -delete") | crontab -
    
    log "Backup system configured"
}

# Setup system monitoring
setup_system_monitoring() {
    log "Setting up system monitoring..."
    
    # Install system monitoring tools
    sudo apt install -y htop iotop nethogs
    
    # Setup log monitoring
    sudo apt install -y fail2ban
    
    # Configure fail2ban for SSH protection
    sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF
    
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    
    log "System monitoring configured"
}

# Setup deployment user
setup_deployment_user() {
    log "Setting up deployment configuration..."
    
    # Create SSH directory if it doesn't exist
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    # Add GitHub to known hosts for CI/CD
    ssh-keyscan github.com >> ~/.ssh/known_hosts
    
    log "Deployment user configured"
}

# Main execution
main() {
    log "Starting MazaoChain production environment setup..."
    
    check_env_vars
    update_system
    install_docker
    install_nodejs
    setup_firewall
    setup_ssl
    setup_app_directory
    setup_monitoring
    setup_backup
    setup_system_monitoring
    setup_deployment_user
    
    log "Production environment setup completed successfully!"
    log "Next steps:"
    log "1. Clone the MazaoChain repository to /opt/mazaochain"
    log "2. Configure environment variables in .env.production"
    log "3. Deploy the application using the CI/CD pipeline"
    log "4. Verify all services are running correctly"
    
    warn "Please log out and log back in for Docker group membership to take effect"
}

# Run main function
main "$@"