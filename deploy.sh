#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting deployment process for Ctrl-Book..."

# AWS Constants
REGION="us-east-1"
ACCOUNT_ID="142247950781"
REPO_NAME="ctrl-book"
ECR_URL="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
SERVICE_ARN="arn:aws:apprunner:${REGION}:${ACCOUNT_ID}:service/ctrl-book-service/d46178d3d2a94cccb18e5c94daf361be"

# 1. Build the Docker image
echo "🔨 Building Docker image (this might take a few minutes)..."
docker build --platform linux/amd64 -t ${REPO_NAME} .

# 2. Tag the image
echo "🏷️ Tagging image for ECR..."
docker tag ${REPO_NAME}:latest ${ECR_URL}/${REPO_NAME}:latest

# 3. Authenticate with AWS ECR
echo "🔐 Authenticating Docker with AWS ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URL}

# 4. Push the image to ECR
echo "☁️ Pushing image to ECR..."
docker push ${ECR_URL}/${REPO_NAME}:latest

# 5. Tell App Runner to start a deployment
echo "🔄 Triggering App Runner deployment..."
aws apprunner start-deployment --service-arn ${SERVICE_ARN}

echo "✅ Deployment initiated successfully!"
echo "⏳ You can check the status in the AWS Console or by running:"
echo "aws apprunner describe-service --service-arn ${SERVICE_ARN} --query 'Service.Status' --output text"
