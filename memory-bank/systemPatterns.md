# System Patterns - 2025-04-17

## Error Patterns

### 500 Internal Server Error

**Symptoms:**
- Server responds with 500 Internal Server Error
- No specific error message in browser
- Resources fail to load
- Browser console shows "Failed to load resource: the server responded with a status of 500 ()"

**Possible Causes:**
1. Malformed `.htaccess` file with syntax errors
2. Incompatible Apache directives for the hosting environment
3. Server-side script errors (PHP, Node.js, etc.)
4. File permission issues preventing execution
5. Memory limits or timeout issues
6. Missing required modules or dependencies
7. Server configuration conflicts

**Diagnosis Approach:**
1. Check server error logs for specific error messages
2. Examine `.htaccess` file for syntax errors
3. Temporarily rename `.htaccess` to disable it and see if error resolves
4. Create a minimal test file to isolate the issue
5. Check file permissions
6. Contact hosting provider for server-specific information

**Solutions:**
1. Fix syntax errors in `.htaccess` file
2. Use only compatible directives for the hosting environment
3. Simplify `.htaccess` file to essential directives
4. Set correct file permissions
5. Increase memory limits or timeout settings if needed
6. Install missing modules or dependencies
7. Resolve server configuration conflicts

### Content Security Policy Blocking Scripts

**Symptoms:**
- Console errors about CSP violations
- Scripts fail to load or execute
- "X is not defined" errors
- Specific error messages like "Refused to load the script X because it violates the following Content Security Policy directive: script-src 'self'"

**Possible Causes:**
1. Restrictive Content Security Policy
2. Missing domains in CSP directives
3. Missing 'unsafe-inline' or 'unsafe-eval' for scripts that require them
4. Incorrect CSP syntax
5. Multiple conflicting CSP definitions
6. Server-level CSP overriding page-level CSP
7. Third-party scripts requiring additional domains

**Diagnosis Approach:**
1. Examine browser console for specific CSP violation messages
2. Check the CSP meta tag in HTML files
3. Check for CSP headers in server response
4. Identify which domains are being blocked
5. Test with a more permissive CSP to isolate the issue
6. Use browser developer tools to monitor network requests

**Solutions:**
1. Update CSP to include all required domains
2. Add 'unsafe-inline' and 'unsafe-eval' if required by scripts
3. Expand connect-src directive to allow API connections
4. Add frame-src entries for authentication services
5. Ensure CSP syntax is correct
6. Resolve conflicts between server-level and page-level CSP
7. Consider using CSP reporting to identify blocked resources

### Firebase Authentication API Key Error

**Symptoms:**
- Error message: "Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)"
- Authentication methods fail (sign in, sign up, etc.)
- Firebase initializes successfully but auth operations fail
- No CSP violation errors in console

**Possible Causes:**
1. Invalid or incorrect API key in Firebase configuration
2. Missing API key in Firebase configuration
3. API key restrictions in Firebase console
4. Domain not authorized in Firebase console
5. CSP missing 'unsafe-eval' in script-src directive
6. CSP missing required authentication domains (especially gstatic.com)
7. Firebase SDK version incompatibility
8. Project configuration mismatch between different environment files
9. Incorrect project ID or auth domain in configuration

**Diagnosis Approach:**
1. Verify API key in Firebase configuration
2. Check API key in Firebase console
3. Check authorized domains in Firebase console
4. Examine CSP for 'unsafe-eval' in script-src directive
5. Check CSP for authentication domains
6. Test with a minimal Firebase configuration
7. Add diagnostic logging to Firebase initialization

**Solutions:**
1. Update API key if incorrect
2. Add API key if missing
3. Update API key restrictions in Firebase console
4. Add domain to authorized domains in Firebase console
5. Add 'unsafe-eval' to script-src directive in CSP
6. Add authentication domains to CSP, especially gstatic.com
7. Update Firebase SDK version if needed
8. Ensure consistent project configuration across all environment files
9. Verify project ID and auth domain match in all configuration files

## Debugging Approaches

### Systematic Debugging Process

1. **Observe and Reproduce**
   - Document exact error messages and symptoms
   - Create a reliable reproduction case
   - Identify patterns in when the error occurs

2. **Isolate the Problem**
   - Create minimal test cases
   - Disable components one by one to identify the culprit
   - Use binary search approach for complex systems

3. **Formulate Hypotheses**
   - List 5-7 possible causes based on symptoms
   - Rank hypotheses by likelihood
   - Focus on the most likely 1-2 causes first

4. **Test Hypotheses**
   - Add strategic logging to validate assumptions
   - Make minimal changes to test each hypothesis
   - Document results of each test

5. **Implement Solution**
   - Create a comprehensive fix
   - Ensure the fix addresses the root cause, not just symptoms
   - Create automated tests to prevent regression

6. **Verify Solution**
   - Test in multiple environments
   - Verify all related functionality
   - Monitor for any side effects

7. **Document Findings**
   - Record the root cause and solution
   - Update system documentation
   - Share knowledge with the team

### Web Hosting Debugging Patterns

1. **Server Configuration Issues**
   - Check for `.htaccess` syntax errors
   - Verify server module availability
   - Test with minimal configuration
   - Isolate custom directives

2. **Content Security Policy Debugging**
   - Start with permissive CSP and gradually restrict
   - Use CSP reporting to identify blocked resources
   - Test each domain and directive individually
   - Document required domains for third-party scripts

3. **Cross-Origin Resource Sharing (CORS)**
   - Check for CORS headers in server response
   - Verify allowed origins match request origins
   - Test with wildcard origin temporarily
   - Check for preflight request handling

4. **Firebase-Specific Patterns**
   - Verify Firebase SDK version compatibility
   - Check for required CSP directives
   - Ensure correct initialization order
   - Test with minimal Firebase configuration

### Firebase Authentication Debugging Patterns

1. **API Key Issues**
   - Verify API key format (should start with "AIza")
   - Check API key in Firebase console
   - Test API key with curl or Postman
   - Check for API key restrictions

2. **CSP Requirements**
   - Add 'unsafe-eval' to script-src directive
   - Add authentication domains to connect-src
   - Add accounts.google.com to frame-src
   - Test with minimal CSP

3. **Authentication Flow**
   - Test anonymous authentication first
   - Check for auth state changes
   - Monitor network requests during authentication
   - Verify correct auth domain

4. **Misleading Error Messages**
   - "auth/api-key-not-valid" often indicates CSP issues, not API key problems
   - "auth/network-request-failed" can indicate CSP or CORS issues
   - "auth/internal-error" often indicates script loading issues

### Mobile App Debugging Patterns

1. **iOS-Web Compatibility Issues**
   - Check for platform-specific API usage
   - Verify Firebase configuration matches between platforms
   - Test authentication flows on both platforms
   - Ensure consistent data models

2. **Firebase SDK Integration**
   - Verify correct SDK versions
   - Check initialization code
   - Test each Firebase service individually
   - Monitor network requests to Firebase endpoints

3. **UI/UX Consistency**
   - Compare component behavior across platforms
   - Test responsive layouts
   - Verify consistent error handling
   - Check accessibility features