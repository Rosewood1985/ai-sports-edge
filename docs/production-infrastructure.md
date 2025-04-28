# AI Sports Edge Production Infrastructure

This document provides an overview of the production infrastructure setup for AI Sports Edge. It covers the four key components: CDN Configuration, Database Scaling, Load Testing, and Backup Systems.

## Table of Contents

1. [Overview](#overview)
2. [CDN Configuration](#cdn-configuration)
3. [Database Scaling](#database-scaling)
4. [Load Testing](#load-testing)
5. [Backup Systems](#backup-systems)
6. [Deployment](#deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Overview

The AI Sports Edge production infrastructure is designed to be scalable, reliable, and secure. It consists of the following components:

- **CDN Configuration**: CloudFront CDN for serving static assets
- **Database Scaling**: RDS database with read replicas and connection pooling
- **Load Testing**: k6 load testing framework for performance verification
- **Backup Systems**: Automated backup procedures for data protection

## CDN Configuration

### Purpose

The Content Delivery Network (CDN) is used to serve static assets (JavaScript, CSS, images, fonts) from edge locations around the world. This improves load times for users and reduces the load on the origin servers.

### Implementation

We use AWS CloudFront as our CDN provider with the following configuration:

- **Origin**: S3 bucket for static assets
- **Cache Behaviors**:
  - JavaScript and CSS files: 1 year TTL (with versioning for cache busting)
  - Images: 1 week TTL
  - Fonts: 1 week TTL
  - API endpoints: No caching
- **Origin Shield**: Enabled to reduce load on origin servers
- **Compression**: Enabled for all compressible content types
- **HTTPS**: Enforced for all requests
- **Custom Error Pages**: Configured for SPA routing

### Deployment

The CDN configuration is deployed using the `infrastructure/cdn/deploy-cdn.sh` script, which:

1. Creates an S3 bucket for static assets if it doesn't exist
2. Creates a CloudFront distribution with the specified configuration
3. Sets up proper cache behaviors for different asset types
4. Configures SSL/TLS certificates for secure delivery

## Database Scaling

### Purpose

Database scaling ensures that the database can handle production traffic without performance degradation. It includes vertical scaling (larger instances), horizontal scaling (read replicas), and connection pooling.

### Implementation

We use AWS RDS PostgreSQL with the following configuration:

- **Instance Type**: db.r5.xlarge for primary instance
- **Storage**: 100GB gp3 with auto-scaling up to 1TB
- **Multi-AZ**: Enabled for high availability
- **Read Replicas**: One read replica for read-heavy operations
- **Connection Pooling**: Configured with:
  - Min connections: 10
  - Max connections: 100
  - Idle timeout: 300 seconds
  - Connection timeout: 30 seconds
- **Parameter Group**: Custom parameters optimized for our workload
- **Monitoring**: Enhanced monitoring and Performance Insights enabled

### Deployment

The database scaling configuration is deployed using the `infrastructure/database/deploy-database.sh` script, which:

1. Creates a DB subnet group if it doesn't exist
2. Creates a security group for database access
3. Creates a custom parameter group with optimized settings
4. Creates or updates the primary database instance
5. Creates a read replica for read-heavy operations
6. Sets up CloudWatch alarms for monitoring

## Load Testing

### Purpose

Load testing verifies that the system can handle expected user load without performance degradation. It helps identify bottlenecks and establish performance baselines.

### Implementation

We use k6 as our load testing framework with the following test scenarios:

- **Smoke Test**: 5 virtual users for 1 minute
- **Load Test**: Ramp up to 100 virtual users over 9 minutes
- **Stress Test**: Ramp up to 1000 virtual users over 32 minutes
- **Soak Test**: 100 virtual users for 1 hour 10 minutes

Each test simulates a typical user journey:
1. Visit homepage
2. Login
3. Browse sports
4. View odds
5. View predictions
6. Logout

### Execution

Load tests are executed using the `infrastructure/load-testing/run-load-tests.sh` script, which:

1. Allows selection of test scenario
2. Runs the selected test with appropriate parameters
3. Generates HTML and JSON reports with results
4. Provides analysis of key metrics:
   - Response time (should be < 500ms for 95% of requests)
   - Error rate (should be < 1%)
   - Success rate (should be > 95%)

## Backup Systems

### Purpose

Backup systems ensure that data can be recovered in case of accidental deletion, corruption, or disaster. They provide multiple recovery points and verification procedures.

### Implementation

We use AWS Backup with the following configuration:

- **Database Backups**:
  - Daily snapshots with 7-day retention
  - Weekly snapshots with 30-day retention
  - Monthly snapshots with 90-day retention
  - Point-in-time recovery enabled
  - Transaction log backups with 24-hour retention

- **File System Backups**:
  - S3 bucket versioning enabled
  - Cross-region replication for disaster recovery
  - Lifecycle policies:
    - Transition to Standard-IA after 30 days
    - Transition to Glacier after 90 days
    - Expiration after 365 days

- **Application State Backups**:
  - DynamoDB point-in-time recovery enabled
  - Daily backups with 7-day retention

- **Backup Verification**:
  - Weekly verification of backup integrity
  - Restore testing for critical data
  - Notification of verification results

### Deployment

The backup systems are deployed using the `infrastructure/backup/setup-backup-system.sh` script, which:

1. Creates an AWS Backup vault
2. Creates an IAM role for AWS Backup
3. Configures database backup plans
4. Sets up S3 bucket versioning and lifecycle policies
5. Configures DynamoDB backup plans
6. Creates a backup verification script
7. Sets up CloudWatch alarms for backup monitoring

## Deployment

The complete production infrastructure can be deployed using the `infrastructure/deploy-production.sh` script, which:

1. Deploys the CDN configuration
2. Deploys the database scaling configuration
3. Sets up the backup systems
4. Runs load tests to verify performance

Each component can be deployed individually or skipped based on user confirmation.

### Prerequisites

- AWS CLI installed and configured
- jq installed for JSON processing
- k6 installed for load testing (optional)
- Appropriate AWS permissions

### Deployment Steps

1. Clone the repository
2. Navigate to the infrastructure directory
3. Run the deployment script:
   ```bash
   ./deploy-production.sh
   ```
4. Follow the prompts to deploy each component

## Monitoring

The production infrastructure is monitored using CloudWatch with the following alarms:

- **Database**:
  - CPU utilization > 80%
  - Freeable memory < 256MB
  - Free storage space < 10GB
  - Database connections > 400
  - Read/write IOPS > thresholds
  - Read/write latency > thresholds
  - Replica lag > 300 seconds

- **Backups**:
  - Failed backup jobs
  - Backup size > threshold
  - Backup duration > threshold

- **CDN**:
  - Error rate > 1%
  - Cache hit ratio < 90%
  - Origin latency > threshold

## Troubleshooting

### Common Issues

1. **CDN Deployment Failures**
   - Check S3 bucket permissions
   - Verify SSL certificate is valid
   - Check CloudFront distribution status

2. **Database Scaling Issues**
   - Check VPC and subnet configuration
   - Verify security group allows necessary traffic
   - Check parameter group compatibility

3. **Load Testing Failures**
   - Verify API endpoints are accessible
   - Check authentication configuration
   - Adjust thresholds for realistic expectations

4. **Backup System Issues**
   - Check IAM role permissions
   - Verify backup vault exists
   - Check resource ARNs are correct

### Support

For additional support, contact the DevOps team at devops@aisportsedge.com.