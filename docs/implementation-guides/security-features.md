# Security Features Implementation Guide

This guide provides an overview of the security features implemented in the AI Sports Edge application, following the atomic architecture pattern.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [API Key and Secret Detection](#api-key-and-secret-detection)
4. [Input Validation and Sanitization](#input-validation-and-sanitization)
5. [Authentication and Authorization](#authentication-and-authorization)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)

## Introduction

Security is a critical aspect of any application, especially one that handles user data, payments, and sensitive information. The AI Sports Edge application implements a comprehensive security solution that addresses the following key areas:

- API key and secret detection to prevent accidental exposure of sensitive credentials
- Input validation and sanitization to prevent injection attacks
- Authentication and authorization to ensure proper access controls

These security features are implemented following the atomic architecture pattern, with atoms providing the basic building blocks, molecules combining these atoms into more complex components, and organisms integrating everything into a cohesive system.

## Architecture Overview

The security features are organized according to the atomic architecture pattern:

### Atoms (Basic Building Blocks)

- **apiKeyPatterns.js**: Defines patterns for detecting hardcoded API keys and secrets
- **inputValidation.js**: Provides utilities for validating and sanitizing user input
- **authChecks.js**: Provides utilities for authentication and authorization checks

### Molecules (Composite Components)

- **apiKeyScanner.js**: Provides functionality for scanning code files for hardcoded API keys
- **inputValidator.js**: Provides higher-level validation for common form types
- **authManager.js**: Manages authentication state and provides authorization checks

### Organisms (Complex Systems)

- **securityManager.js**: Integrates all security features into a single interface

## API Key and Secret Detection

The API key and secret detection system scans the codebase for hardcoded API keys, tokens, and other sensitive information that should not be committed to the repository.

### Key Features

- Detects a wide range of API keys and secrets using regular expression patterns
- Supports allowlisting of specific files (e.g., example files, test files)
- Provides severity levels for different types of secrets
- Generates detailed reports of detected secrets

### Usage

You can use the `scan-for-api-keys.js` script to scan the codebase for hardcoded API keys:

```bash
./scripts/scan-for-api-keys.js --path ./src --output api-key-scan-results.json
```

Options:

- `--path <path>`: Path to scan (default: current directory)
- `--output <file>`: Output file for results (default: api-key-scan-results.json)
- `--include-allowlisted`: Include allowlisted files in results
- `--severity <level>`: Minimum severity level to report (critical, high, medium, low, info)
- `--format <format>`: Output format (json, text)
- `--help`: Show help

### Programmatic Usage

```javascript
const { securityManager } = require('../atomic/organisms/security');

// Scan for secrets
const results = await securityManager.scanForSecrets('./src', {
  includeAllowlisted: false,
  severityFilter: ['critical', 'high'],
  saveResults: true,
  outputPath: 'api-key-scan-results.json',
});

console.log(`Found ${results.counts.total} potential secrets`);
```

## Input Validation and Sanitization

The input validation and sanitization system provides utilities for validating and sanitizing user input to prevent injection attacks and other security vulnerabilities.

### Key Features

- Validates common input types (email, URL, phone, username, password)
- Sanitizes input for display in HTML to prevent XSS attacks
- Sanitizes input for use in SQL queries to prevent SQL injection
- Provides pre-defined validation schemas for common form types
- Supports custom validation schemas

### Validation Schemas

The system includes pre-defined validation schemas for common form types:

- `USER_REGISTRATION`: User registration form
- `USER_LOGIN`: User login form
- `PROFILE_UPDATE`: Profile update form
- `PASSWORD_CHANGE`: Password change form
- `CONTACT_FORM`: Contact form
- `PAYMENT_FORM`: Payment form

### Usage

```javascript
const { securityManager } = require('../atomic/organisms/security');

// Validate a registration form
const formData = {
  username: 'johndoe',
  email: 'john@example.com',
  password: 'P@ssw0rd123',
  confirmPassword: 'P@ssw0rd123',
  firstName: 'John',
  lastName: 'Doe',
  termsAccepted: true,
};

const { sanitized, errors } = securityManager.validateForm(formData, 'USER_REGISTRATION');

if (errors) {
  console.error('Validation errors:', errors);
} else {
  console.log('Form data is valid:', sanitized);
}
```

## Authentication and Authorization

The authentication and authorization system provides utilities for managing user authentication and authorization.

### Key Features

- User authentication with email and password
- Social login support
- Token-based authentication
- Role-based access control
- Resource-based access control
- Session management

### Permission Levels

The system defines the following permission levels:

- `NONE`: No permissions
- `READ`: Can read content
- `COMMENT`: Can read and comment on content
- `EDIT`: Can edit content
- `CREATE`: Can create content
- `DELETE`: Can delete content
- `ADMIN`: Has full administrative access

### Default Roles

The system defines the following default roles:

- `GUEST`: Can only view public content
- `USER`: Can view and comment on content
- `CONTRIBUTOR`: Can create and edit own content
- `EDITOR`: Can edit all content
- `ADMIN`: Has full administrative access

### Usage

```javascript
const { securityManager } = require('../atomic/organisms/security');

// Initialize security manager
await securityManager.initialize();

// Login
const loginResult = await securityManager.login('john@example.com', 'P@ssw0rd123');

if (loginResult.success) {
  console.log('Logged in as:', loginResult.user);

  // Check permissions
  if (securityManager.hasPermission(securityManager.PERMISSION_LEVELS.EDIT)) {
    console.log('User can edit content');
  }

  // Check resource access
  const resource = {
    id: '123',
    ownerId: '456',
    title: 'Example Resource',
  };

  if (securityManager.hasResourceAccess(resource, 'edit')) {
    console.log('User can edit this resource');
  }

  // Logout
  await securityManager.logout();
}
```

## Usage Examples

### Scanning for API Keys

```javascript
const { securityManager } = require('../atomic/organisms/security');

// Scan for secrets
const results = await securityManager.scanForSecrets('./src', {
  includeAllowlisted: false,
  severityFilter: ['critical', 'high'],
  saveResults: true,
  outputPath: 'api-key-scan-results.json',
});

console.log(`Found ${results.counts.total} potential secrets`);
```

### Validating User Input

```javascript
const { securityManager } = require('../atomic/organisms/security');

// Validate a login form
const formData = {
  email: 'john@example.com',
  password: 'P@ssw0rd123',
  rememberMe: true,
};

const { sanitized, errors } = securityManager.validateForm(formData, 'USER_LOGIN');

if (errors) {
  console.error('Validation errors:', errors);
} else {
  console.log('Form data is valid:', sanitized);
}
```

### Managing Authentication

```javascript
const { securityManager } = require('../atomic/organisms/security');

// Initialize security manager
await securityManager.initialize();

// Login
const loginResult = await securityManager.login('john@example.com', 'P@ssw0rd123');

if (loginResult.success) {
  console.log('Logged in as:', loginResult.user);

  // Get authentication token
  const token = securityManager.getAuthToken();

  // Add auth state change listener
  const unsubscribe = securityManager.onAuthStateChanged(authState => {
    console.log('Auth state changed:', authState);
  });

  // Logout
  await securityManager.logout();

  // Remove listener
  unsubscribe();
}
```

## Best Practices

### API Key Security

1. **Never hardcode API keys**: Store API keys in environment variables or a secure key management system.
2. **Use the API key scanner**: Regularly scan your codebase for hardcoded API keys.
3. **Set up pre-commit hooks**: Configure pre-commit hooks to prevent committing API keys.
4. **Rotate API keys**: Regularly rotate API keys to minimize the impact of key exposure.

### Input Validation

1. **Validate all user input**: Never trust user input and always validate it before processing.
2. **Use the provided validation schemas**: Use the pre-defined validation schemas for common form types.
3. **Sanitize output**: Always sanitize user input before displaying it to prevent XSS attacks.
4. **Use parameterized queries**: Use parameterized queries or ORM libraries to prevent SQL injection.

### Authentication and Authorization

1. **Use strong passwords**: Enforce strong password requirements.
2. **Implement multi-factor authentication**: Consider adding multi-factor authentication for sensitive operations.
3. **Use HTTPS**: Always use HTTPS to protect authentication credentials in transit.
4. **Implement proper access controls**: Use the role-based and resource-based access control features.
5. **Validate tokens**: Always validate authentication tokens before granting access.
