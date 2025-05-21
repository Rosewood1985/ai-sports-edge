# System Patterns

## Dependency Management Patterns (May 20, 2025)

### Pattern: Automated Dependency Updates

**Description:**
A pattern for automating the process of updating dependencies in the project. This pattern ensures that dependencies are kept up-to-date, secure, and compatible with the application.

**Components:**

1. **Dependency Update Script**: A script that checks for outdated packages and updates them
2. **Backup System**: A system for creating backups before updates
3. **Testing Integration**: Integration with the testing system to verify updates
4. **Documentation**: Documentation of the update process and decisions

**Implementation:**

```javascript
// Example implementation pattern for dependency updates
function updateDependencies(options) {
  // Create backup
  const backupPath = createBackup();

  try {
    // Check for outdated packages
    const outdatedPackages = checkOutdated();

    // Apply updates based on strategy
    if (options.strategy === 'patch') {
      applyPatchUpdates(outdatedPackages);
    } else if (options.strategy === 'minor') {
      applyMinorUpdates(outdatedPackages);
    } else if (options.strategy === 'major') {
      applyMajorUpdates(outdatedPackages);
    } else if (options.strategy === 'security') {
      applySecurityUpdates();
    }

    // Run tests to verify updates
    const testResult = runTests();

    if (!testResult.success) {
      // Restore backup if tests fail
      restoreBackup(backupPath);
      return { success: false, error: testResult.error };
    }

    return { success: true };
  } catch (error) {
    // Restore backup if an error occurs
    restoreBackup(backupPath);
    return { success: false, error };
  }
}
```

**Usage:**

```javascript
// Example usage of the dependency update pattern
const result = updateDependencies({
  strategy: 'minor', // 'patch', 'minor', 'major', or 'security'
});

if (result.success) {
  console.log('Dependencies updated successfully');
} else {
  console.error('Error updating dependencies:', result.error);
}
```

**Benefits:**

- Ensures dependencies are kept up-to-date
- Reduces security vulnerabilities
- Improves stability through testing
- Provides a consistent process for updates
- Reduces the risk of breaking changes

### Pattern: Dependency Group Management

**Description:**
A pattern for managing groups of dependencies that should be kept in sync. This pattern ensures that related dependencies are updated together to maintain compatibility.

**Components:**

1. **Dependency Groups**: Groups of related dependencies
2. **Version Synchronization**: Logic for keeping versions in sync
3. **Compatibility Checking**: Logic for checking compatibility between dependencies

**Implementation:**

```javascript
// Example implementation pattern for dependency group management
const dependencyGroups = [
  {
    name: 'React',
    packages: ['react', 'react-dom', 'react-test-renderer'],
    compatibility: {
      react: {
        '17.0.2': { 'react-dom': '17.0.2', 'react-test-renderer': '17.0.2' },
        '18.0.0': { 'react-dom': '18.0.0', 'react-test-renderer': '18.0.0' },
      },
    },
  },
  {
    name: 'React Navigation',
    packages: [
      '@react-navigation/native',
      '@react-navigation/stack',
      '@react-navigation/bottom-tabs',
    ],
    compatibility: {
      '@react-navigation/native': {
        '6.0.10': { '@react-navigation/stack': '6.2.1', '@react-navigation/bottom-tabs': '6.3.1' },
      },
    },
  },
];

function updateDependencyGroup(groupName, version) {
  const group = dependencyGroups.find(g => g.name === groupName);

  if (!group) {
    return { success: false, error: `Group ${groupName} not found` };
  }

  const mainPackage = group.packages[0];
  const compatibility = group.compatibility[mainPackage][version];

  if (!compatibility) {
    return { success: false, error: `Version ${version} not found for ${mainPackage}` };
  }

  // Update all packages in the group
  for (const pkg of group.packages) {
    if (pkg === mainPackage) {
      updatePackage(pkg, version);
    } else {
      updatePackage(pkg, compatibility[pkg]);
    }
  }

  return { success: true };
}
```

**Usage:**

```javascript
// Example usage of the dependency group management pattern
const result = updateDependencyGroup('React', '18.0.0');

if (result.success) {
  console.log('React dependencies updated successfully');
} else {
  console.error('Error updating React dependencies:', result.error);
}
```

**Benefits:**

- Ensures related dependencies are kept in sync
- Reduces compatibility issues
- Simplifies the update process for related dependencies
- Improves stability through consistent versioning

## Firebase Firestore Backup Patterns (May 20, 2025)

### Pattern: Automated Database Backups

**Description:**
A pattern for automating the process of backing up Firebase Firestore data. This pattern ensures that data is regularly backed up and can be restored in case of data loss.

**Components:**

1. **Backup Scheduler**: A system for scheduling regular backups
2. **Backup Exporter**: A system for exporting data from Firestore
3. **Backup Storage**: A system for storing backups securely
4. **Backup Restorer**: A system for restoring data from backups

**Implementation:**

```javascript
// Example implementation pattern for automated database backups
class FirestoreBackupService {
  constructor(options) {
    this.firestore = options.firestore;
    this.storage = options.storage;
    this.collections = options.collections || [];
    this.retentionDays = options.retentionDays || 30;
  }

  async createBackup() {
    const timestamp = new Date().toISOString();
    const backupPath = `backups/${timestamp}`;

    // Export data from Firestore
    const data = await this.exportData();

    // Store backup in Cloud Storage
    await this.storage.upload(backupPath, data);

    // Clean up old backups
    await this.cleanupOldBackups();

    return { success: true, path: backupPath };
  }

  async exportData() {
    const data = {};

    for (const collection of this.collections) {
      const snapshot = await this.firestore.collection(collection).get();
      data[collection] = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
      }));
    }

    return data;
  }

  async cleanupOldBackups() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const [files] = await this.storage.getFiles({ prefix: 'backups/' });

    for (const file of files) {
      const fileDate = new Date(file.name.split('/')[1]);

      if (fileDate < cutoffDate) {
        await file.delete();
      }
    }
  }

  async restoreBackup(backupPath) {
    // Download backup from Cloud Storage
    const [data] = await this.storage.file(backupPath).download();
    const parsedData = JSON.parse(data.toString());

    // Restore data to Firestore
    for (const [collection, documents] of Object.entries(parsedData)) {
      for (const doc of documents) {
        await this.firestore.collection(collection).doc(doc.id).set(doc.data);
      }
    }

    return { success: true };
  }
}
```

**Usage:**

```javascript
// Example usage of the automated database backup pattern
const backupService = new FirestoreBackupService({
  firestore: admin.firestore(),
  storage: admin.storage().bucket(),
  collections: ['users', 'posts', 'comments'],
  retentionDays: 30,
});

// Create a backup
const backup = await backupService.createBackup();

// Restore a backup
await backupService.restoreBackup(backup.path);
```

**Benefits:**

- Ensures data is regularly backed up
- Reduces the risk of data loss
- Provides a consistent process for backups
- Enables quick recovery in case of data loss
- Manages storage costs through retention policies

## Accessibility Patterns (May 21, 2025)

### Pattern: Accessible Component Wrappers

**Description:**
A pattern for creating accessible versions of standard UI components. This pattern ensures that all UI components have proper accessibility attributes and behavior, making the application usable by people with disabilities.

**Components:**

1. **AccessibleThemedText**: An accessible version of the ThemedText component
2. **AccessibleThemedView**: An accessible version of the ThemedView component
3. **AccessibleTouchableOpacity**: An accessible version of the TouchableOpacity component

**Implementation:**

```tsx
// Example implementation pattern for accessible text component
export type AccessibleThemedTextProps = TextProps & {
  type?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'bodyStd'
    | 'bodySmall'
    | 'label'
    | 'button'
    | 'small'
    | 'defaultSemiBold';
  color?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'action'
    | 'statusHigh'
    | 'statusMedium'
    | 'statusLow';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  applyHighContrast?: boolean;
  applyLargeText?: boolean;
  applyBoldText?: boolean;
  highContrastStyle?: any;
  largeTextStyle?: any;
  boldTextStyle?: any;
};

export function AccessibleThemedText({
  style,
  children,
  type = 'bodyStd',
  color,
  accessibilityLabel,
  accessibilityHint,
  applyHighContrast = true,
  applyLargeText = true,
  applyBoldText = true,
  highContrastStyle,
  largeTextStyle,
  boldTextStyle,
  ...props
}: AccessibleThemedTextProps) {
  const { colors } = useTheme();
  const [preferences, setPreferences] = React.useState<AccessibilityPreferences>(
    accessibilityService.getPreferences()
  );

  // Get the text style based on the type prop
  const getTextStyle = () => {
    switch (type) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'h4':
        return styles.h4;
      case 'bodyStd':
        return styles.bodyStd;
      case 'bodySmall':
        return styles.bodySmall;
      case 'label':
        return styles.label;
      case 'button':
        return styles.button;
      case 'small':
        return styles.small;
      case 'defaultSemiBold':
        return styles.defaultSemiBold;
      default:
        return styles.bodyStd;
    }
  };

  // Determine accessibility role based on type
  const getAccessibilityRole = () => {
    switch (type) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
        return 'header';
      case 'button':
        return 'button';
      default:
        return 'text';
    }
  };

  // Get accessibility props
  const accessibilityProps =
    accessibilityLabel || getDefaultAccessibilityLabel()
      ? accessibilityService.getAccessibilityProps(
          accessibilityLabel || getDefaultAccessibilityLabel() || '',
          accessibilityHint,
          getAccessibilityRole(),
          undefined
        )
      : {};

  // Apply styles based on preferences
  const appliedStyle = [
    getTextStyle(),
    { color: getTextColor() },
    style,
    shouldApplyHighContrast && styles.highContrast,
    shouldApplyHighContrast && highContrastStyle,
    shouldApplyLargeText && styles.largeText,
    shouldApplyLargeText && largeTextStyle,
    shouldApplyBoldText && styles.boldText,
    shouldApplyBoldText && boldTextStyle,
  ];

  return (
    <Text style={appliedStyle} {...accessibilityProps} {...props}>
      {children}
    </Text>
  );
}
```

**Usage:**

```tsx
// Example usage of the accessible component pattern
<AccessibleThemedText
  style={styles.title}
  type="h1"
  accessibilityLabel="Screen title"
>
  Welcome to AI Sports Edge
</AccessibleThemedText>

<AccessibleThemedView
  style={styles.container}
  accessibilityLabel="Main content container"
>
  {children}
</AccessibleThemedView>

<AccessibleTouchableOpacity
  style={styles.button}
  onPress={handlePress}
  accessibilityLabel="Submit form"
  accessibilityRole="button"
  accessibilityHint="Submits the form and proceeds to the next screen"
>
  <AccessibleThemedText type="button">Submit</AccessibleThemedText>
</AccessibleTouchableOpacity>
```

**Benefits:**

- Ensures all UI components have proper accessibility attributes
- Improves the user experience for people with disabilities
- Centralizes accessibility logic in reusable components
- Maintains consistent accessibility implementation across the application
- Simplifies the process of making the application accessible

### Pattern: Accessibility Testing Automation

**Description:**
A pattern for automating the testing of accessibility features in the application. This pattern ensures that accessibility issues are identified and fixed early in the development process.

**Components:**

1. **Accessibility Test Script**: A script that checks for common accessibility issues
2. **CI/CD Integration**: Integration with the CI/CD pipeline to run accessibility tests
3. **Reporting System**: A system for generating reports of accessibility issues

**Implementation:**

```javascript
// Example implementation pattern for accessibility testing
function checkAccessibility(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Check for missing accessibility props
  if (content.includes('<View') && !content.includes('accessibilityLabel')) {
    issues.push({
      type: 'accessibilityProps',
      component: path.basename(filePath),
      description: 'View component without accessibility props',
      line: findLineNumber(content, '<View'),
      severity: 'medium',
      suggestion: 'Add accessibilityLabel or use AccessibleThemedView',
    });
  }

  // Check for text without accessibility
  if (content.includes('<Text') && !content.includes('accessibilityLabel')) {
    issues.push({
      type: 'textAccessibility',
      component: path.basename(filePath),
      description: 'Text component without accessibility props',
      line: findLineNumber(content, '<Text'),
      severity: 'high',
      suggestion: 'Add accessibilityLabel or use AccessibleThemedText',
    });
  }

  // Check for touchable without accessibility
  if (content.includes('<TouchableOpacity') && !content.includes('accessibilityRole')) {
    issues.push({
      type: 'touchableAccessibility',
      component: path.basename(filePath),
      description: 'TouchableOpacity without accessibility props',
      line: findLineNumber(content, '<TouchableOpacity'),
      severity: 'high',
      suggestion: 'Add accessibilityRole and accessibilityLabel',
    });
  }

  return issues;
}
```

**Usage:**

```javascript
// Example usage of the accessibility testing pattern
const files = scanDirectories(['./screens', './components']);
let totalIssues = 0;

files.forEach(file => {
  const issues = checkAccessibility(file);
  totalIssues += issues.length;

  if (issues.length > 0) {
    console.log(`Found ${issues.length} accessibility issues in ${file}:`);
    issues.forEach(issue => {
      console.log(`- ${issue.description} (line ${issue.line}): ${issue.suggestion}`);
    });
  }
});

console.log(`Total accessibility issues: ${totalIssues}`);
```

**Benefits:**

- Identifies accessibility issues early in the development process
- Ensures consistent accessibility implementation across the application
- Provides clear guidance on how to fix accessibility issues
- Integrates with the CI/CD pipeline to prevent accessibility regressions
- Generates reports for tracking accessibility progress
