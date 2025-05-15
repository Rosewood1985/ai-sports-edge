#!/usr/bin/env node

/**
 * AI Sports Edge - Implementation Status Report Generator
 * 
 * This script analyzes the codebase to determine which architectural
 * components have been implemented and generates a status report.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the task list based on the atomic architecture plan
const TASK_LIST = [
  {
    category: "ATOMIC ARCHITECTURE FOUNDATION",
    tasks: [
      "Atoms - Core primitive components",
      "Molecules - Composite components",
      "Organisms - Complex components",
      "Templates - Page layouts",
      "Pages - Screen components"
    ]
  },
  {
    category: "FIREBASE INTEGRATION",
    tasks: [
      "Firebase App initialization",
      "Firebase Authentication",
      "Firestore database integration",
      "Firebase Storage integration",
      "Firebase Analytics integration",
      "Firebase Hosting configuration",
      "Firebase Functions integration",
      "Error tracking and monitoring"
    ]
  },
  {
    category: "CORE APP INFRASTRUCTURE",
    tasks: [
      "Federated user identity system with tier-based access",
      "Dynamic odds engine with caching layer for real-time sync",
      "Prediction engine with ML integration",
      "Cross-platform synchronization service",
      "Enhanced caching service",
      "User preferences service",
      "License verification service",
      "Performance monitoring service"
    ]
  },
  {
    category: "UI COMPONENTS",
    tasks: [
      "Theme provider with dark/light mode support",
      "Internationalization (i18n) support",
      "Responsive layout system",
      "Form components with validation",
      "Data visualization components",
      "Navigation components",
      "Notification components",
      "Modal and dialog components"
    ]
  },
  {
    category: "BETTING FEATURES",
    tasks: [
      "Odds comparison engine",
      "Bet slip management",
      "Betting history tracking",
      "Betting analytics dashboard",
      "Prop bet list components",
      "Trending bets components",
      "Player statistics components",
      "Comparative analysis components"
    ]
  },
  {
    category: "USER EXPERIENCE",
    tasks: [
      "Onboarding flow",
      "Authentication screens",
      "User profile management",
      "Subscription management",
      "Referral system",
      "Personalization features",
      "FAQ and help system",
      "Offline mode support"
    ]
  }
];

// Helper function to check if a directory exists
const directoryExists = (dirPath) => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
};

// Helper function to search for files matching a pattern
const findFiles = (pattern) => {
  try {
    const output = execSync(`find . -type f -path "${pattern}" -not -path "*/node_modules/*" -not -path "*/build/*" -not -path "*/dist/*" -not -path "*/coverage/*"`, { encoding: 'utf8' });
    return output.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    console.error(`Error finding files with pattern ${pattern}:`, error.message);
    return [];
  }
};

// Helper function to search for content in files
const searchInFiles = (keywords, filePattern = '*.{js,ts,tsx,jsx}') => {
  try {
    // Create a regex pattern from keywords
    const keywordPattern = keywords
      .toLowerCase()
      .split(' ')
      .filter(k => k.length > 3) // Skip small words
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape regex special chars
      .join('|');
    
    if (!keywordPattern) return [];
    
    const command = `grep -l -i -E "${keywordPattern}" --include="${filePattern}" -r ./src ./atomic ./components ./features 2>/dev/null || true`;
    const output = execSync(command, { encoding: 'utf8' });
    return output.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    console.error(`Error searching for keywords ${keywords}:`, error.message);
    return [];
  }
};

// Check for atomic architecture implementation
const checkAtomicArchitecture = () => {
  const atomicStructure = {
    atoms: directoryExists('./atomic/atoms'),
    molecules: directoryExists('./atomic/molecules'),
    organisms: directoryExists('./atomic/organisms'),
    templates: directoryExists('./atomic/templates'),
    pages: directoryExists('./atomic/pages')
  };
  
  const atomFiles = findFiles('./atomic/atoms/*.{js,ts,tsx}');
  const moleculeFiles = findFiles('./atomic/molecules/*.{js,ts,tsx}');
  const organismFiles = findFiles('./atomic/organisms/*.{js,ts,tsx}');
  const templateFiles = findFiles('./atomic/templates/*.{js,ts,tsx}');
  const pageFiles = findFiles('./atomic/pages/*.{js,ts,tsx}');
  
  return {
    'Atoms - Core primitive components': {
      implemented: atomicStructure.atoms && atomFiles.length > 0,
      files: atomFiles
    },
    'Molecules - Composite components': {
      implemented: atomicStructure.molecules && moleculeFiles.length > 0,
      files: moleculeFiles
    },
    'Organisms - Complex components': {
      implemented: atomicStructure.organisms && organismFiles.length > 0,
      files: organismFiles
    },
    'Templates - Page layouts': {
      implemented: atomicStructure.templates && templateFiles.length > 0,
      files: templateFiles
    },
    'Pages - Screen components': {
      implemented: atomicStructure.pages && pageFiles.length > 0,
      files: pageFiles
    }
  };
};

// Check for Firebase integration
const checkFirebaseIntegration = () => {
  return {
    'Firebase App initialization': {
      implemented: searchInFiles('firebase initializeApp firebaseApp').length > 0,
      files: searchInFiles('firebase initializeApp firebaseApp')
    },
    'Firebase Authentication': {
      implemented: searchInFiles('firebase auth signIn signUp signOut').length > 0,
      files: searchInFiles('firebase auth signIn signUp signOut')
    },
    'Firestore database integration': {
      implemented: searchInFiles('firebase firestore collection document').length > 0,
      files: searchInFiles('firebase firestore collection document')
    },
    'Firebase Storage integration': {
      implemented: searchInFiles('firebase storage uploadFile downloadFile').length > 0,
      files: searchInFiles('firebase storage uploadFile downloadFile')
    },
    'Firebase Analytics integration': {
      implemented: searchInFiles('firebase analytics logEvent trackEvent').length > 0,
      files: searchInFiles('firebase analytics logEvent trackEvent')
    },
    'Firebase Hosting configuration': {
      implemented: findFiles('./firebase.json').length > 0 || findFiles('./.firebase/*').length > 0,
      files: [...findFiles('./firebase.json'), ...findFiles('./.firebase/*')]
    },
    'Firebase Functions integration': {
      implemented: directoryExists('./functions') && findFiles('./functions/*.{js,ts}').length > 0,
      files: findFiles('./functions/*.{js,ts}')
    },
    'Error tracking and monitoring': {
      implemented: searchInFiles('error tracking monitoring sentry').length > 0,
      files: searchInFiles('error tracking monitoring sentry')
    }
  };
};

// Check for core app infrastructure
const checkCoreInfrastructure = () => {
  return {
    'Federated user identity system with tier-based access': {
      implemented: searchInFiles('user identity tier access role permission').length > 0,
      files: searchInFiles('user identity tier access role permission')
    },
    'Dynamic odds engine with caching layer for real-time sync': {
      implemented: searchInFiles('odds engine cache real-time sync').length > 0,
      files: searchInFiles('odds engine cache real-time sync')
    },
    'Prediction engine with ML integration': {
      implemented: searchInFiles('prediction engine machine learning ML').length > 0,
      files: searchInFiles('prediction engine machine learning ML')
    },
    'Cross-platform synchronization service': {
      implemented: searchInFiles('cross platform sync synchronization').length > 0,
      files: searchInFiles('cross platform sync synchronization')
    },
    'Enhanced caching service': {
      implemented: searchInFiles('cache caching service enhanced').length > 0,
      files: searchInFiles('cache caching service enhanced')
    },
    'User preferences service': {
      implemented: searchInFiles('user preferences settings service').length > 0,
      files: searchInFiles('user preferences settings service')
    },
    'License verification service': {
      implemented: searchInFiles('license verification service').length > 0,
      files: searchInFiles('license verification service')
    },
    'Performance monitoring service': {
      implemented: searchInFiles('performance monitoring service').length > 0,
      files: searchInFiles('performance monitoring service')
    }
  };
};

// Check for UI components
const checkUIComponents = () => {
  return {
    'Theme provider with dark/light mode support': {
      implemented: searchInFiles('theme provider dark light mode').length > 0,
      files: searchInFiles('theme provider dark light mode')
    },
    'Internationalization (i18n) support': {
      implemented: searchInFiles('i18n internationalization language translation').length > 0,
      files: searchInFiles('i18n internationalization language translation')
    },
    'Responsive layout system': {
      implemented: searchInFiles('responsive layout system grid').length > 0,
      files: searchInFiles('responsive layout system grid')
    },
    'Form components with validation': {
      implemented: searchInFiles('form validation input field').length > 0,
      files: searchInFiles('form validation input field')
    },
    'Data visualization components': {
      implemented: searchInFiles('chart graph visualization data').length > 0,
      files: searchInFiles('chart graph visualization data')
    },
    'Navigation components': {
      implemented: searchInFiles('navigation navbar menu drawer').length > 0,
      files: searchInFiles('navigation navbar menu drawer')
    },
    'Notification components': {
      implemented: searchInFiles('notification toast alert message').length > 0,
      files: searchInFiles('notification toast alert message')
    },
    'Modal and dialog components': {
      implemented: searchInFiles('modal dialog popup overlay').length > 0,
      files: searchInFiles('modal dialog popup overlay')
    }
  };
};

// Check for betting features
const checkBettingFeatures = () => {
  return {
    'Odds comparison engine': {
      implemented: searchInFiles('odds comparison engine compare').length > 0,
      files: searchInFiles('odds comparison engine compare')
    },
    'Bet slip management': {
      implemented: searchInFiles('bet slip management cart').length > 0,
      files: searchInFiles('bet slip management cart')
    },
    'Betting history tracking': {
      implemented: searchInFiles('betting history track record').length > 0,
      files: searchInFiles('betting history track record')
    },
    'Betting analytics dashboard': {
      implemented: searchInFiles('betting analytics dashboard stats').length > 0,
      files: searchInFiles('betting analytics dashboard stats')
    },
    'Prop bet list components': {
      implemented: searchInFiles('prop bet list component').length > 0,
      files: searchInFiles('prop bet list component')
    },
    'Trending bets components': {
      implemented: searchInFiles('trending bets popular component').length > 0,
      files: searchInFiles('trending bets popular component')
    },
    'Player statistics components': {
      implemented: searchInFiles('player statistics stats component').length > 0,
      files: searchInFiles('player statistics stats component')
    },
    'Comparative analysis components': {
      implemented: searchInFiles('comparative analysis compare component').length > 0,
      files: searchInFiles('comparative analysis compare component')
    }
  };
};

// Check for user experience features
const checkUserExperience = () => {
  return {
    'Onboarding flow': {
      implemented: searchInFiles('onboarding flow welcome tutorial').length > 0,
      files: searchInFiles('onboarding flow welcome tutorial')
    },
    'Authentication screens': {
      implemented: searchInFiles('authentication login signup register').length > 0,
      files: searchInFiles('authentication login signup register')
    },
    'User profile management': {
      implemented: searchInFiles('user profile management account').length > 0,
      files: searchInFiles('user profile management account')
    },
    'Subscription management': {
      implemented: searchInFiles('subscription management billing payment').length > 0,
      files: searchInFiles('subscription management billing payment')
    },
    'Referral system': {
      implemented: searchInFiles('referral system invite friend').length > 0,
      files: searchInFiles('referral system invite friend')
    },
    'Personalization features': {
      implemented: searchInFiles('personalization customize preference').length > 0,
      files: searchInFiles('personalization customize preference')
    },
    'FAQ and help system': {
      implemented: searchInFiles('faq help support question answer').length > 0,
      files: searchInFiles('faq help support question answer')
    },
    'Offline mode support': {
      implemented: searchInFiles('offline mode support cache').length > 0,
      files: searchInFiles('offline mode support cache')
    }
  };
};

// Generate the implementation status report
const generateReport = () => {
  console.log('# AI Sports Edge Implementation Status Report');
  console.log(`*Generated on ${new Date().toLocaleDateString()}*\n`);
  
  // Check implementation status for each category
  const implementationStatus = {
    'ATOMIC ARCHITECTURE FOUNDATION': checkAtomicArchitecture(),
    'FIREBASE INTEGRATION': checkFirebaseIntegration(),
    'CORE APP INFRASTRUCTURE': checkCoreInfrastructure(),
    'UI COMPONENTS': checkUIComponents(),
    'BETTING FEATURES': checkBettingFeatures(),
    'USER EXPERIENCE': checkUserExperience()
  };
  
  // Generate report for each category
  TASK_LIST.forEach(category => {
    console.log(`## ${category.category}`);
    
    const categoryStatus = implementationStatus[category.category];
    
    category.tasks.forEach(task => {
      const status = categoryStatus[task];
      const statusIcon = status.implemented ? '✅ IMPLEMENTED' : '❌ NOT FOUND';
      
      console.log(`- **${statusIcon}**: ${task}`);
      
      if (status.implemented && status.files.length > 0) {
        console.log('  - Found in:');
        status.files.slice(0, 5).forEach(file => {
          console.log(`    - \`${file}\``);
        });
        
        if (status.files.length > 5) {
          console.log(`    - *and ${status.files.length - 5} more files*`);
        }
      }
    });
    
    console.log('');
  });
  
  // Generate summary
  console.log('## Summary');
  
  let totalTasks = 0;
  let implementedTasks = 0;
  
  Object.values(implementationStatus).forEach(category => {
    Object.values(category).forEach(task => {
      totalTasks++;
      if (task.implemented) {
        implementedTasks++;
      }
    });
  });
  
  const implementationPercentage = Math.round((implementedTasks / totalTasks) * 100);
  
  console.log(`- **Total Tasks**: ${totalTasks}`);
  console.log(`- **Implemented**: ${implementedTasks} (${implementationPercentage}%)`);
  console.log(`- **Remaining**: ${totalTasks - implementedTasks} (${100 - implementationPercentage}%)`);
  
  // Generate recommendations
  console.log('\n## Recommendations');
  
  if (implementationPercentage < 25) {
    console.log('- Focus on implementing the core atomic architecture foundation first');
    console.log('- Prioritize Firebase integration for authentication and data storage');
    console.log('- Establish the basic UI components and navigation structure');
  } else if (implementationPercentage < 50) {
    console.log('- Continue building out the core infrastructure components');
    console.log('- Implement the remaining Firebase services');
    console.log('- Develop the betting-specific features');
  } else if (implementationPercentage < 75) {
    console.log('- Focus on user experience improvements');
    console.log('- Enhance the betting analytics and visualization components');
    console.log('- Implement the remaining infrastructure services');
  } else {
    console.log('- Polish the user interface and experience');
    console.log('- Optimize performance and reduce bundle size');
    console.log('- Implement advanced features like ML-based predictions');
  }
};

// Run the report generator
generateReport();