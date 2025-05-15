# Firebase Upgrade TODO

## Urgent Firebase Package Updates (April 2025)

1. **Node.js Runtime Upgrade**
   - Current: Node.js 18
   - Warning: Will be deprecated on 2025-04-30 and decommissioned on 2025-10-31
   - Action: Upgrade to Node.js 20

2. **Firebase Functions SDK Upgrade**
   - Current: firebase-functions 4.9.0
   - Issue: Outdated version lacking support for newest Firebase Extensions features
   - Action: Run `npm install --save firebase-functions@latest` in functions directory
   - Note: Will include breaking changes that need to be addressed

3. **Firebase Admin SDK**
   - Current: Needs verification
   - Action: Ensure using latest version compatible with other upgrades

## Implementation Plan

1. Create a new branch for the upgrade
2. Update package.json dependencies
3. Test functions locally
4. Address any breaking changes
5. Deploy and verify in staging environment
6. Deploy to production

## Additional Notes

- The Remote Config integration with Cloud Functions needs to be tested after upgrades
- Consider updating deployment scripts to handle function updates more gracefully