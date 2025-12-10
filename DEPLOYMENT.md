# E-Learning Platform - Deployment Guide

## Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Docker Deployment](#docker-deployment)
3. [AWS Cloud Deployment](#aws-cloud-deployment)
4. [Performance Optimization](#performance-optimization)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Security Checklist](#security-checklist)

---

## Development Environment Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Git

### Step-by-Step Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd elearning-platform
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:5432/elearning_db"
export REDIS_HOST="localhost"
export SECRET_KEY="dev-secret-key-change-in-production"

# Run database migrations
alembic upgrade head

# Start development server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. ML API Setup
```bash
cd ml-models

# Use same venv or create new
pip install -r ../backend/requirements.txt

# Start ML API
uvicorn ml_api:app --host 0.0.0.0 --port 8001 --reload
```

#### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:8000" > .env
echo "REACT_APP_ML_API_URL=http://localhost:8001" >> .env

# Start development server
npm start
```

#### 5. Database Initialization
```bash
# Create database
createdb elearning_db

# Run schema
psql -d elearning_db -f database/schema.sql

# Or use pgAdmin for GUI management
```

---

## Docker Deployment

### Quick Start with Docker Compose

#### 1. Environment Configuration
```bash
# Create .env file
cat > .env << EOF
DB_PASSWORD=secure_password_here
SECRET_KEY=your-super-secret-key-min-32-chars
POSTGRES_DB=elearning_db
POSTGRES_USER=postgres
EOF
```

#### 2. Build and Start Services
```bash
# Build all services
docker-compose build

# Start all services in detached mode
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f ml_api
```

#### 3. Initialize Database
```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create admin user (optional)
docker-compose exec backend python create_admin.py
```

#### 4. Access Services
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- ML API: http://localhost:8001
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

#### 5. Stopping Services
```bash
# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Production Docker Setup

#### 1. Build Production Images
```bash
# Use production Docker Compose
docker-compose -f docker-compose.prod.yml build

# Push to registry (if using)
docker-compose -f docker-compose.prod.yml push
```

#### 2. Production Environment Variables
```bash
cat > .env.production << EOF
# Database
DATABASE_URL=postgresql://postgres:secure_pass@db-host:5432/elearning_db

# Redis
REDIS_HOST=redis-host
REDIS_PASSWORD=redis_secure_pass

# Security
SECRET_KEY=$(openssl rand -hex 32)

# API URLs
API_URL=https://api.yourdomain.com
ML_API_URL=https://ml-api.yourdomain.com

# Features
ENABLE_CACHING=true
ENABLE_ML_RECOMMENDATIONS=true
LOG_LEVEL=INFO
EOF
```

---

## AWS Cloud Deployment

### Architecture Overview
```
┌─────────────────────────────────────────────────────┐
│                   Route 53 (DNS)                     │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│              Application Load Balancer               │
│         (SSL/TLS Termination + Auto Scaling)        │
└──────────────┬────────────────┬──────────────────────┘
               │                │
    ┌──────────┴────────┐  ┌───┴──────────────┐
    │   EC2 Instances   │  │  EC2 Instances   │
    │   (Backend/ML)    │  │   (Frontend)     │
    │   Auto Scaling    │  │  Auto Scaling    │
    └──────────┬────────┘  └──────────────────┘
               │
    ┌──────────┴──────────────────┐
    │      RDS PostgreSQL         │
    │    (Multi-AZ Deployment)    │
    └──────────┬──────────────────┘
               │
    ┌──────────┴──────────────────┐
    │    ElastiCache Redis        │
    │   (Cluster Mode Enabled)    │
    └─────────────────────────────┘
```

### Step 1: RDS PostgreSQL Setup

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier elearning-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.7 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 7 \
  --multi-az \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name elearning-db-subnet

# Wait for instance to be available
aws rds wait db-instance-available \
  --db-instance-identifier elearning-db

# Get connection endpoint
aws rds describe-db-instances \
  --db-instance-identifier elearning-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Step 2: ElastiCache Redis Setup

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id elearning-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name elearning-redis-subnet \
  --security-group-ids sg-xxxxxxxx

# Get Redis endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id elearning-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text
```

### Step 3: EC2 Instance Setup

```bash
# Create EC2 instance
aws ec2 run-instances \
  --image-id ami-xxxxxxxx \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --user-data file://setup-script.sh \
  --tag-specifications \
    'ResourceType=instance,Tags=[{Key=Name,Value=elearning-backend}]'

# Setup script (setup-script.sh)
#!/bin/bash
yum update -y
yum install -y docker git

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start Docker
systemctl start docker
systemctl enable docker

# Clone repository
cd /opt
git clone <repository-url> elearning-platform
cd elearning-platform

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:<password>@<rds-endpoint>:5432/elearning_db
REDIS_HOST=<redis-endpoint>
SECRET_KEY=<secret-key>
EOF

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: S3 for Media Storage

```bash
# Create S3 bucket
aws s3 mb s3://elearning-media-bucket

# Configure bucket policy
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::elearning-media-bucket/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket elearning-media-bucket \
  --policy file://bucket-policy.json

# Enable CORS
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"]
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket elearning-media-bucket \
  --cors-configuration file://cors.json
```

### Step 5: Load Balancer Setup

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name elearning-alb \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-xxxxxxxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name elearning-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxxxxxxx \
  --health-check-path /health

# Register targets
aws elbv2 register-targets \
  --target-group-arn <target-group-arn> \
  --targets Id=<instance-id>

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<certificate-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

### Step 6: Auto Scaling Setup

```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name elearning-template \
  --version-description v1 \
  --launch-template-data file://launch-template.json

# Create Auto Scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name elearning-asg \
  --launch-template LaunchTemplateName=elearning-template \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2 \
  --target-group-arns <target-group-arn> \
  --health-check-type ELB \
  --health-check-grace-period 300 \
  --vpc-zone-identifier "subnet-xxxxxxxx,subnet-yyyyyyyy"

# Create scaling policies
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name elearning-asg \
  --policy-name scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration file://scale-up-policy.json
```

---

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indices for frequently queried fields
CREATE INDEX CONCURRENTLY idx_user_progress_user_course 
  ON user_progress(user_id, course_id);

CREATE INDEX CONCURRENTLY idx_ml_recommendations_user_score 
  ON ml_recommendations(user_id, recommendation_score DESC);

-- Analyze tables regularly
ANALYZE VERBOSE;

-- Vacuum to reclaim space
VACUUM ANALYZE;
```

### 2. Redis Caching Strategy

```python
# Cache frequently accessed data
CACHE_STRATEGIES = {
    'recommendations': 3600,  # 1 hour
    'course_list': 1800,      # 30 minutes
    'user_progress': 300,     # 5 minutes
    'analytics': 1800,        # 30 minutes
}
```

### 3. Application Performance

```bash
# Enable Gunicorn with multiple workers
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --keep-alive 5

# Frontend build optimization
npm run build -- --production
```

### 4. CDN Configuration

```bash
# Use CloudFront for static assets
aws cloudfront create-distribution \
  --origin-domain-name s3://elearning-media-bucket \
  --default-cache-behavior MinTTL=86400,MaxTTL=31536000
```

---

## Monitoring & Maintenance

### 1. CloudWatch Monitoring

```bash
# Set up CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# Database monitoring
aws cloudwatch put-metric-alarm \
  --alarm-name db-connections \
  --alarm-description "Alert when DB connections > 80" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### 2. Application Logging

```python
# Configure structured logging
import logging
import json

logger = logging.getLogger(__name__)
handler = logging.FileHandler('/var/log/elearning/app.log')
formatter = logging.Formatter(
    '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
    '"message": "%(message)s", "module": "%(module)s"}'
)
handler.setFormatter(formatter)
logger.addHandler(handler)
```

### 3. Database Backups

```bash
# Automated RDS backups
aws rds modify-db-instance \
  --db-instance-identifier elearning-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"

# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier elearning-db \
  --db-snapshot-identifier elearning-db-snapshot-$(date +%Y%m%d)
```

---

## Security Checklist

### Application Security
- [ ] Use HTTPS/TLS for all connections
- [ ] Implement JWT token expiration (1 hour recommended)
- [ ] Use bcrypt for password hashing
- [ ] Sanitize all user inputs
- [ ] Implement rate limiting
- [ ] Enable CORS properly
- [ ] Use environment variables for secrets
- [ ] Implement SQL injection prevention (SQLAlchemy ORM)
- [ ] Add security headers (HSTS, CSP, X-Frame-Options)

### Infrastructure Security
- [ ] Use VPC with private subnets
- [ ] Configure security groups properly
- [ ] Enable encryption at rest (RDS, S3)
- [ ] Enable encryption in transit
- [ ] Use IAM roles instead of access keys
- [ ] Enable CloudTrail logging
- [ ] Configure WAF rules
- [ ] Regular security updates
- [ ] Backup and disaster recovery plan

### Compliance
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policies
- [ ] User data export/deletion
- [ ] Audit logging
- [ ] Privacy policy implementation

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check connectivity
psql -h <rds-endpoint> -U postgres -d elearning_db

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxxxxx
```

#### High Memory Usage
```bash
# Check container stats
docker stats

# Adjust memory limits
docker-compose up -d --scale backend=2
```

#### Slow API Response
```bash
# Check backend logs
docker-compose logs backend | grep "ERROR\|SLOW"

# Profile with locust
locust -f load_test.py --host=http://localhost:8000
```

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check system metrics
- Verify backup completion

### Weekly
- Review performance metrics
- Update dependencies (security patches)
- Database optimization (VACUUM, ANALYZE)

### Monthly
- Full system audit
- Review and update documentation
- Capacity planning review
- Security vulnerability scan

### Quarterly
- Disaster recovery drill
- Performance testing
- Architecture review
- Cost optimization

---

## Support & Resources

- Documentation: https://docs.elearning-platform.com
- GitHub Issues: https://github.com/your-org/elearning-platform/issues
- Email: devops@elearning-platform.com
- Slack: #elearning-platform-support