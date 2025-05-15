# Update Instructions

This document provides instructions for updating the AI Sports Edge project, including pushing documentation to GitHub and updating the web and mobile apps.

## Recent Changes

We have made the following changes to the project:

1. **Added Comprehensive Documentation**
   - ESPN API integration plan and business impact analysis
   - Bet365 API integration plan, business impact analysis, and implementation guide
   - Combined integration summary, implementation roadmap, and business impact analysis

2. **Created Update Scripts**
   - `scripts/push-docs-to-github.sh`: Script to push documentation to GitHub
   - `scripts/update-web-app.sh`: Script to build and deploy the web app
   - `scripts/update-mobile-app.sh`: Script to build and update the mobile app
   - `scripts/update-all.sh`: Master script to run all update scripts in sequence

## Updating the Project

### Option 1: Update Everything at Once

To update everything (documentation, web app, and mobile app) at once, run:

```bash
./scripts/update-all.sh
```

This script will:
1. Push all documentation to GitHub
2. Build and deploy the web app
3. Build and submit updates for the mobile app

### Option 2: Update Individual Components

If you want to update only specific components, you can run the individual scripts:

#### Push Documentation to GitHub

```bash
./scripts/push-docs-to-github.sh
```

#### Update Web App

```bash
./scripts/update-web-app.sh
```

#### Update Mobile App

```bash
./scripts/update-mobile-app.sh
```

## Verification

After running the update scripts, you should verify that the updates were successful:

### Documentation

1. Go to the GitHub repository: `https://github.com/your-organization/ai-sports-edge`
2. Navigate to the `docs` directory
3. Confirm that all documentation files are present and properly formatted

### Web App

1. Visit the deployed web app URL
2. Verify that the latest changes are reflected
3. Test key functionality to ensure everything works as expected

### Mobile App

1. Check the status of the mobile app builds with `eas build:list`
2. Once the builds are complete, download and install the test builds
3. Verify that the latest changes are reflected in the mobile app
4. Test key functionality to ensure everything works as expected

## Troubleshooting

### GitHub Push Issues

If you encounter issues pushing to GitHub:

1. Ensure you have the correct permissions for the repository
2. Check if there are any conflicts that need to be resolved
3. Try pulling the latest changes before pushing: `git pull origin main`

### Web App Deployment Issues

If the web app deployment fails:

1. Check the Firebase deployment logs
2. Ensure your Firebase configuration is correct
3. Verify that the build process completed successfully

### Mobile App Build Issues

If the mobile app builds fail:

1. Check the EAS build logs
2. Ensure your EAS configuration in `eas.json` is correct
3. Verify that you're logged in to the correct EAS account

## Next Steps

After successfully updating the project, consider the following next steps:

1. **Implement ESPN API Integration**
   - Follow the implementation plan in `docs/espn-api-ml-integration-plan.md`
   - Start with the foundation phase as outlined in the roadmap

2. **Implement Bet365 API Integration**
   - Follow the implementation guide in `docs/bet365-api-implementation-guide.md`
   - Set up the necessary environment and configuration

3. **Enhance ML Models**
   - Integrate the new data sources into the ML pipeline
   - Develop and test the enhanced prediction models

## Conclusion

By following these instructions, you can easily update the AI Sports Edge project and keep it in sync across GitHub, web, and mobile platforms. The automated scripts simplify the process and ensure consistency across all platforms.

For more detailed information about the scripts, refer to the `scripts/README.md` file.