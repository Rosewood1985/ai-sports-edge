# Firebase/Cloud Resources Documentation

This document provides comprehensive information about the production-grade Firebase and cloud resources used in AI Sports Edge.

## Overview

AI Sports Edge uses Firebase as its primary cloud platform, with additional Google Cloud Platform (GCP) services for specific needs. The infrastructure is designed to be scalable, secure, and cost-effective.

## Firebase Project Structure

We use a multi-environment approach with separate Firebase projects:

1. **Production**: `ai-sports-edge-prod`
   - Primary customer-facing environment
   - Highest security and scaling requirements
   - Strict deployment controls

2. **Staging**: `ai-sports-edge-staging`
   - Pre-production testing environment
   - Mirrors production configuration
   - Used for final QA before production deployment

3. **Development**: `ai-sports-edge-dev`
   - Development and testing environment
   - Less restrictive security rules
   - Used for feature development and testing

4. **Local**: Firebase Emulator Suite
   - Local development environment
   - No cloud resources used
   - Fastest development iteration

## Firebase Services

### Hosting Configuration

Production configuration includes:

- **Custom Domains**:
  - Primary domain: `ai-sports-edge.com`
  - Redirect domain: `www.ai-sports-edge.com` (redirects to primary domain)
  - API subdomain: `api.ai-sports-edge.com`
  - Admin subdomain: `admin.ai-sports-edge.com`

- **SSL Certificates**:
  - Managed SSL certificates for all domains
  - Minimum TLS version: TLS 1.2
  - HTTP Strict Transport Security (HSTS) enabled
  - OCSP Stapling enabled
  - Certificate Transparency enabled

- **Redirects and Routing**:
  - HTTP to HTTPS redirects
  - www to non-www redirects
  - Legacy URL redirects (e.g., `/about-us` to `/about`)
  - SPA routing for client-side navigation
  - API routing to appropriate backends
  - Custom error pages for 404 and 500 errors

- **Caching and Performance**:
  - Long-lived caching for static assets (JS, CSS, images)
  - No caching for HTML files
  - Medium caching for JSON files
  - Compression enabled
  - Clean URLs (no .html extension)
  - Trailing slash normalization

- **Security Headers**:
  - Content Security Policy (CSP)
  - Strict Transport Security (HSTS)
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer Policy
  - Permissions Policy

### Authentication

Production configuration includes:

- Multiple sign-in methods:
  - Email/password
  - Google
  - Apple
  - Facebook
- Multi-factor authentication (MFA)
- Email link authentication
- Custom email templates
- Advanced security settings:
  - Password requirements
  - Account lockout after failed attempts
  - IP address restrictions

### Firestore Database

Production configuration includes:

- Optimized indexes for common queries (see `firestore.indexes.json`)
- Strict security rules (see `firestore.rules`)
- Multi-region deployment for high availability
- Automatic backups:
  - Daily backups retained for 30 days
  - Weekly backups retained for 90 days
  - Monthly backups retained for 1 year
- Data lifecycle management:
  - Archiving of old data
  - TTL (Time To Live) for temporary data

### Cloud Storage

Production configuration includes:

- Strict security rules (see `storage.rules`)
- Content validation:
  - File type restrictions
  - File size limits
  - Metadata requirements
- Lifecycle management:
  - Automatic transition to Nearline storage after 30 days
  - Automatic deletion of temporary files after 24 hours
- CORS configuration for web and mobile access

### Cloud Functions

Production configuration includes:

- Scalable instance configuration:
  - Minimum instances: 5 (prevents cold starts)
  - Maximum instances: 50 (handles traffic spikes)
- Resource allocation:
  - Memory: 2GB
  - CPU: 2 vCPUs
  - Timeout: 300 seconds
- VPC connector for secure database access
- Retry configuration for reliability
- Error handling and monitoring

### Hosting

Production configuration includes:

- Global CDN distribution
- Custom domain with SSL
- Cache control headers:
  - Long-lived caching for static assets
  - No caching for HTML files
  - Medium caching for JSON files
- Security headers:
  - Content Security Policy (CSP)
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer-Policy
- Clean URLs and trailing slash normalization

## Scaling Configuration

### Firestore Scaling

- **Sharding**: 5 shards for high-write collections
- **Indexes**: Optimized for common queries
- **Caching**: Client-side caching with 100MB cache size
- **Offline Support**: Enabled for web and mobile clients
- **Query Optimization**: Collection group queries for cross-collection data

### Cloud Functions Scaling

- **Minimum Instances**: 5 instances to prevent cold starts
- **Maximum Instances**: 50 instances to handle traffic spikes
- **Memory**: 2GB per instance for complex operations
- **CPU**: 2 vCPUs per instance for compute-intensive tasks
- **Concurrency**: 80 concurrent executions per instance

### Cloud Storage Scaling

- **Multi-Region**: Data replicated across multiple regions
- **Cache-Control**: Appropriate caching headers for different file types
- **CORS Configuration**: Optimized for web and mobile access
- **Lifecycle Management**: Automatic transition to lower-cost storage classes

### Hosting Scaling

- **Global CDN**: Content delivered from edge locations worldwide
- **Cache Control**: Optimized caching for different file types
- **Compression**: Automatic gzip/Brotli compression
- **Preconnect Headers**: Improved loading performance

## Security Configuration

### Authentication Security

- **MFA**: Multi-factor authentication for sensitive operations
- **Password Requirements**: Strong password requirements
- **Account Lockout**: Temporary lockout after failed attempts
- **Session Management**: Configurable session duration
- **IP Restrictions**: Optional IP address restrictions for admin access

### Firestore Security

- **Authentication**: All writes require authentication
- **User Data Isolation**: Users can only access their own data
- **Admin Access**: Separate admin collection with elevated privileges
- **Data Validation**: Server-side validation of all writes
- **Rate Limiting**: Basic rate limiting for write operations

### Cloud Storage Security

- **Authentication**: Most operations require authentication
- **Content Validation**: File type and size validation
- **Metadata Requirements**: Required metadata for all uploads
- **Public Access Control**: Strict control over publicly accessible files

### Cloud Functions Security

- **Authentication**: Functions require appropriate authentication
- **Input Validation**: All inputs are validated
- **Secrets Management**: Secrets stored in Secret Manager
- **VPC Connector**: Secure database access via VPC

## Monitoring and Alerting

### Firebase Monitoring

- **Error Monitoring**: Automatic error reporting
- **Performance Monitoring**: Web and mobile performance tracking
- **Usage Monitoring**: Resource usage tracking
- **Custom Logging**: Structured logging for all operations

### Alerts

- **High Error Rate**: Alert when error rate exceeds 1%
- **High Latency**: Alert when p95 latency exceeds 500ms
- **High Billing**: Alert when daily billing exceeds $100
- **Authentication Anomalies**: Alert on unusual authentication patterns
- **Function Failures**: Alert on repeated function failures

### Logging

- **Retention**: 30-day log retention
- **Export**: Automatic export to BigQuery for long-term analysis
- **Structured Logging**: Consistent log format across all services
- **Correlation IDs**: Request tracing across services

## Deployment Process

### Production Deployment

1. **Prepare**: Make all scripts executable with `chmod +x scripts/*.sh`
2. **Check API Keys**: Run `scripts/check-api-keys.sh` to ensure all necessary API keys are available
3. **Test in Staging**: Run `scripts/test-staging-deployment.sh` to test in a staging environment first
4. **Deploy**: Run `scripts/deploy-firebase-production.sh` for the full deployment process
5. **Configure Webhooks**: Run `scripts/configure-webhooks.sh` to set up webhooks for your production environment
6. **Test Web App**: Run `scripts/test-webapp-functionality.sh` to test the web app's functionality
7. **Verify**: Verify deployment with post-deployment tests
8. **Monitor**: Monitor for any issues after deployment

The deployment script handles:
- API key verification
- Staging environment testing
- Firebase configuration updates
- Security rules deployment
- Index deployment
- Function deployment with appropriate scaling
- Hosting deployment with cache headers
- Custom domain and SSL certificate setup
- Webhook configuration
- Web app functionality testing
- Monitoring and alerting setup

All scripts include detailed help text and error handling to guide users through the process. The documentation provides comprehensive information about the implementation details and best practices.

### Rollback Process

In case of issues:

1. Run `firebase hosting:clone <version> production`
2. Verify the rollback
3. Investigate and fix the issue

### CI/CD Pipeline

The deployment process is automated using a CI/CD pipeline implemented with GitHub Actions. The pipeline is defined in `.github/workflows/firebase-deployment.yml` and includes the following stages:

1. **Test**: Runs linting, unit tests, and type checking
2. **Deploy to Staging**: Deploys to the staging environment and tests the deployment
3. **Deploy to Production**: Deploys to the production environment, sets up custom domains and SSL certificates, configures webhooks, and tests the web app functionality
4. **Notify**: Sends notifications about the deployment status

To set up the CI/CD pipeline, run:

```bash
# Make the script executable
chmod +x scripts/setup-cicd-pipeline.sh

# Run the setup script
./scripts/setup-cicd-pipeline.sh
```

This script will:
- Set up GitHub repository secrets for API keys and tokens
- Create staging and production environments in GitHub
- Enable GitHub Actions for the repository
- Commit and push the workflow file

For more details about the deployment process, see [Deployment Process Documentation](./deployment-process.md).

### Next Steps

After deploying your Firebase/cloud resources, follow these steps to ensure everything is properly configured:

1. **Set Up CI/CD Pipeline**: Run `./scripts/setup-cicd-pipeline.sh` to set up the CI/CD pipeline
2. **Test the Deployment**: Verify that all features are working correctly in the production environment
3. **Monitor Performance**: Check the Firebase console for performance metrics and errors
4. **Set Up Alerts**: Configure alerts for critical metrics to be notified of issues
5. **Schedule Regular Backups**: Ensure that regular backups are configured and tested
6. **Document Configuration**: Keep documentation up to date with any changes to the configuration
7. **Train Team Members**: Ensure that all team members understand the deployment process and monitoring tools
8. **Perform Security Audit**: Regularly audit security rules and access controls
9. **Monitor CI/CD Pipeline**: Regularly check the CI/CD pipeline for successful deployments
10. **Optimize Costs**: Review resource usage and optimize costs where possible

## Cost Optimization

### Firestore Optimization

- **Indexes**: Only necessary indexes are created
- **Document Size**: Documents are kept small
- **Read/Write Patterns**: Optimized to minimize operations
- **Caching**: Client-side caching to reduce reads

### Cloud Functions Optimization

- **Minimum Instances**: Balanced to prevent cold starts while controlling costs
- **Function Consolidation**: Related operations combined where appropriate
- **Execution Time**: Functions optimized for quick execution
- **Memory Allocation**: Right-sized for the workload

### Cloud Storage Optimization

- **Lifecycle Management**: Automatic transition to lower-cost storage classes
- **Compression**: Images and files compressed where appropriate
- **Content Delivery**: CDN caching to reduce storage operations

## Backup and Disaster Recovery

### Firestore Backups

- **Schedule**: Daily automated backups
- **Retention**: 30-day retention policy
- **Location**: Backups stored in a separate region
- **Testing**: Regular restore testing

### Cloud Storage Backups

- **Critical Data**: Replicated to a backup bucket
- **Versioning**: Object versioning enabled for critical buckets
- **Cross-Region**: Data replicated across regions

### Disaster Recovery Plan

1. **Detection**: Monitoring alerts on service disruption
2. **Assessment**: Determine scope and impact
3. **Recovery**:
   - For Firestore: Restore from latest backup
   - For Storage: Use replicated data
   - For Functions: Redeploy from source control
4. **Verification**: Verify system integrity after recovery

## Future Enhancements

1. **Multi-Region Deployment**: Deploy to multiple regions for lower latency
2. **Enhanced Security**: Implement more advanced security features
3. **Cost Optimization**: Further optimize resource usage
4. **Performance Improvements**: Enhance caching and query performance
5. **Scalability Improvements**: Prepare for higher user loads

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics#best_practices)
- [Firestore Performance Best Practices](https://firebase.google.com/docs/firestore/best-practices)