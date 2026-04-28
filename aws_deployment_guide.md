# Ctrl-Book AWS Deployment Guide

This document serves as a record of how the `ctrl-book` application was successfully deployed to AWS App Runner, including the initial setup hurdles and a quick-reference guide for deploying future updates.

## 1. How We Fixed the Initial Build Errors
Deploying a Next.js + Prisma application via Docker to App Runner required a few specific optimizations:

1. **Prisma & OpenSSL Compatibility**: The default Alpine Linux image lacked the required `libssl` bindings. We fixed this by switching the `Dockerfile` base image to **`node:20-slim`** (Debian-based) and explicitly declaring `binaryTargets = ["native", "debian-openssl-3.0.x"]` in `schema.prisma`.
2. **Next.js Prerendering**: During the `npm run build` step, Next.js tries to fetch data to statically generate pages. Since the build environment doesn't have access to the production RDS database, the build crashed. We fixed this by adding `export const dynamic = "force-dynamic";` to all Admin Dashboard pages, forcing them to render at request time.
3. **App Runner IAM Role**: App Runner needed permission to pull the Docker image from a private ECR repository. We created an IAM Role (`AppRunnerECRAccessRole`) with the `AWSAppRunnerServicePolicyForECRAccess` policy attached.
4. **App Runner Health Checks**: We increased the TCP Health Check timeout to ensure the Next.js standalone server had enough time to initialize before AWS considered it "unhealthy".

---

## 2. Initial Setup Commands (For Reference)

These are the commands we ran to provision the infrastructure for the very first time. You do **not** need to run these again unless you are setting up a completely new environment.

### Create ECR Repository
```bash
aws ecr create-repository --repository-name ctrl-book
```

### Create RDS Database
```bash
aws rds create-db-instance --db-instance-identifier ctrl-book-db \
  --db-instance-class db.t3.micro --engine postgres \
  --master-username postgres --master-user-password <YOUR_PASSWORD> \
  --allocated-storage 20
```

### Make RDS Publicly Accessible & Open Security Group
```bash
aws rds modify-db-instance --db-instance-identifier ctrl-book-db --publicly-accessible --apply-immediately

# Find Security Group ID and allow Port 5432
SG_ID=$(aws rds describe-db-instances --db-instance-identifier ctrl-book-db --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" --output text)
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 5432 --cidr 0.0.0.0/0
```

### Create App Runner Service
```bash
aws apprunner create-service \
  --service-name ctrl-book-service \
  --health-check-configuration '{
    "Protocol": "TCP",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 3
  }' \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "142247950781.dkr.ecr.us-east-1.amazonaws.com/ctrl-book:latest",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "DATABASE_URL": "postgresql://postgres:<PASSWORD>@ctrl-book-db.cs1uuwwm6um2.us-east-1.rds.amazonaws.com:5432/postgres",
          "NODE_ENV": "production",
          "HOSTNAME": "0.0.0.0"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::142247950781:role/AppRunnerECRAccessRole"
    }
  }'
```

---

## 3. How to Deploy Future Changes 🚀

Whenever you modify your local code (like we just did with the Night Mode colors) and want to push the update to your live website, follow these **four steps**:

### Step 1: Build the New Docker Image
Run this from the root of your `ctrl-book` project directory:
```bash
docker build --platform linux/amd64 -t ctrl-book .
```

### Step 2: Tag the Image for ECR
```bash
docker tag ctrl-book:latest 142247950781.dkr.ecr.us-east-1.amazonaws.com/ctrl-book:latest
```

### Step 3: Push the Image to AWS
*Note: Make sure your Docker client is authenticated with AWS before running this.*
```bash
# Optional: Authenticate Docker if you get "Access Denied"
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 142247950781.dkr.ecr.us-east-1.amazonaws.com

# Push the image
docker push 142247950781.dkr.ecr.us-east-1.amazonaws.com/ctrl-book:latest
```

### Step 4: Tell App Runner to Redeploy
AWS App Runner won't automatically detect the new image unless auto-deploy is configured. To forcefully pull the new image and update your live site seamlessly (with zero downtime), run:
```bash
aws apprunner start-deployment --service-arn arn:aws:apprunner:us-east-1:142247950781:service/ctrl-book-service/d46178d3d2a94cccb18e5c94daf361be
```

You can monitor the deployment status by running:
```bash
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:142247950781:service/ctrl-book-service/d46178d3d2a94cccb18e5c94daf361be \
  --query "Service.Status" \
  --output text
```
*(When it says `RUNNING`, your new code is live!)*
