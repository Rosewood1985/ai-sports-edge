import { Platform } from 'react-native';

import { captureException } from './errorTrackingService';
import { info, error, LogCategory } from './loggingService';

/**
 * Help Center Service
 *
 * This service provides access to help documentation, FAQs, and support resources.
 */

// Help article categories
export enum HelpCategory {
  GETTING_STARTED = 'getting_started',
  ACCOUNT = 'account',
  SUBSCRIPTION = 'subscription',
  BETTING = 'betting',
  PREDICTIONS = 'predictions',
  PAYMENT = 'payment',
  TROUBLESHOOTING = 'troubleshooting',
  PRIVACY_SECURITY = 'privacy_security',
  LEGAL = 'legal',
}

// Help article interface
export interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  content: string;
  tags: string[];
  lastUpdated: string;
  relatedArticles?: string[];
}

// FAQ interface
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: HelpCategory;
  tags: string[];
}

// Support contact methods
export enum ContactMethod {
  EMAIL = 'email',
  CHAT = 'chat',
  PHONE = 'phone',
  SOCIAL = 'social',
}

// Support contact information
export interface ContactInfo {
  method: ContactMethod;
  value: string;
  availabilityHours?: string;
  description?: string;
}

// Help center state
let helpArticles: HelpArticle[] = [];
let faqs: FAQ[] = [];
let contactInfo: ContactInfo[] = [];
let isInitialized = false;

/**
 * Initialize the help center
 * @returns Promise that resolves when initialization is complete
 */
export const initHelpCenter = async (): Promise<boolean> => {
  try {
    if (isInitialized) {
      return true;
    }

    info(LogCategory.APP, 'Initializing help center');

    // In a real implementation, this would fetch help content from a server
    // For now, we'll use mock data
    helpArticles = getMockHelpArticles();
    faqs = getMockFAQs();
    contactInfo = getMockContactInfo();

    isInitialized = true;
    info(LogCategory.APP, 'Help center initialized successfully');
    return true;
  } catch (err) {
    error(LogCategory.APP, 'Failed to initialize help center', err as Error);
    captureException(err as Error);
    return false;
  }
};

/**
 * Get all help articles
 * @returns Array of help articles
 */
export const getHelpArticles = (): HelpArticle[] => {
  return [...helpArticles];
};

/**
 * Get help articles by category
 * @param category Help category
 * @returns Array of help articles in the specified category
 */
export const getHelpArticlesByCategory = (category: HelpCategory): HelpArticle[] => {
  return helpArticles.filter(article => article.category === category);
};

/**
 * Get a help article by ID
 * @param id Article ID
 * @returns Help article or undefined if not found
 */
export const getHelpArticleById = (id: string): HelpArticle | undefined => {
  return helpArticles.find(article => article.id === id);
};

/**
 * Search help articles
 * @param query Search query
 * @returns Array of help articles matching the query
 */
export const searchHelpArticles = (query: string): HelpArticle[] => {
  const normalizedQuery = query.toLowerCase().trim();

  return helpArticles.filter(article => {
    // Search in title
    if (article.title.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Search in content
    if (article.content.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Search in tags
    if (article.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))) {
      return true;
    }

    return false;
  });
};

/**
 * Get all FAQs
 * @returns Array of FAQs
 */
export const getFAQs = (): FAQ[] => {
  return [...faqs];
};

/**
 * Get FAQs by category
 * @param category Help category
 * @returns Array of FAQs in the specified category
 */
export const getFAQsByCategory = (category: HelpCategory): FAQ[] => {
  return faqs.filter(faq => faq.category === category);
};

/**
 * Search FAQs
 * @param query Search query
 * @returns Array of FAQs matching the query
 */
export const searchFAQs = (query: string): FAQ[] => {
  const normalizedQuery = query.toLowerCase().trim();

  return faqs.filter(faq => {
    // Search in question
    if (faq.question.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Search in answer
    if (faq.answer.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Search in tags
    if (faq.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))) {
      return true;
    }

    return false;
  });
};

/**
 * Get contact information
 * @returns Array of contact information
 */
export const getContactInfo = (): ContactInfo[] => {
  return [...contactInfo];
};

/**
 * Get contact information by method
 * @param method Contact method
 * @returns Contact information for the specified method
 */
export const getContactInfoByMethod = (method: ContactMethod): ContactInfo | undefined => {
  return contactInfo.find(info => info.method === method);
};

/**
 * Open help article in browser
 * @param articleId Article ID
 * @returns Promise that resolves when the article is opened
 */
export const openHelpArticleInBrowser = async (articleId: string): Promise<boolean> => {
  try {
    const article = getHelpArticleById(articleId);

    if (!article) {
      return false;
    }

    // In a real implementation, this would open the article in a browser
    // For now, we'll just log it
    info(LogCategory.APP, `Opening help article in browser: ${article.title}`);

    return true;
  } catch (err) {
    error(LogCategory.APP, 'Failed to open help article in browser', err as Error);
    captureException(err as Error);
    return false;
  }
};

/**
 * Contact support
 * @param method Contact method
 * @param message Optional message
 * @returns Promise that resolves when the contact is initiated
 */
export const contactSupport = async (method: ContactMethod, message?: string): Promise<boolean> => {
  try {
    const contact = getContactInfoByMethod(method);

    if (!contact) {
      return false;
    }

    // In a real implementation, this would initiate contact
    // For now, we'll just log it
    info(LogCategory.APP, `Contacting support via ${method}`, { message });

    return true;
  } catch (err) {
    error(LogCategory.APP, 'Failed to contact support', err as Error);
    captureException(err as Error);
    return false;
  }
};

/**
 * Get mock help articles
 * @returns Array of mock help articles
 */
const getMockHelpArticles = (): HelpArticle[] => {
  return [
    {
      id: 'getting-started-guide',
      title: 'Getting Started with AI Sports Edge',
      category: HelpCategory.GETTING_STARTED,
      content: `
# Getting Started with AI Sports Edge

Welcome to AI Sports Edge! This guide will help you get started with our app and make the most of our AI-powered sports betting predictions.

## Creating an Account

1. Download the AI Sports Edge app from the App Store or Google Play
2. Open the app and tap "Sign Up"
3. Enter your email address and create a password
4. Verify your email address
5. Complete your profile

## Navigating the App

The app has four main sections:

- **Home**: View featured games and predictions
- **Games**: Browse all games and predictions
- **My Bets**: Track your betting history
- **Profile**: Manage your account and settings

## Understanding Predictions

Our AI-powered predictions are based on advanced algorithms and data analysis. Each prediction includes:

- Win probability
- Recommended bet
- Confidence score
- Key factors

## Placing Bets

AI Sports Edge does not handle actual betting. To place a bet:

1. View a prediction in the app
2. Tap "Bet Now" to be redirected to your preferred sportsbook
3. Place your bet on the sportsbook's platform
4. Return to AI Sports Edge to track your bet

## Getting Help

If you need assistance, you can:

- Browse our help articles
- Check the FAQ section
- Contact our support team via email, chat, or phone

We're here to help you have the best possible experience with AI Sports Edge!
      `,
      tags: ['getting started', 'guide', 'tutorial', 'introduction'],
      lastUpdated: '2025-03-01',
      relatedArticles: ['understanding-predictions', 'subscription-plans'],
    },
    {
      id: 'understanding-predictions',
      title: 'Understanding AI Predictions',
      category: HelpCategory.PREDICTIONS,
      content: `
# Understanding AI Predictions

AI Sports Edge uses advanced machine learning algorithms to generate predictions for sports events. This article explains how to interpret and use these predictions.

## Prediction Components

Each prediction includes:

### Win Probability

This is the estimated probability of a team winning, expressed as a percentage. For example, a 65% win probability means our AI estimates the team has a 65% chance of winning.

### Recommended Bet

Based on the win probability and odds, our AI recommends the best bet to place. This could be:

- Moneyline (betting on the winner)
- Point spread (betting on the margin of victory)
- Over/under (betting on the total score)

### Confidence Score

This is a measure of how confident our AI is in its prediction, on a scale of 1-10. Higher scores indicate higher confidence.

### Key Factors

These are the main factors that influenced the prediction, such as:

- Team performance metrics
- Player statistics
- Historical matchups
- Recent form
- Injuries
- Weather conditions (for outdoor sports)

## Interpreting Predictions

It's important to understand that no prediction is 100% accurate. Sports outcomes are influenced by many factors, including luck and human performance variability.

Our predictions are designed to give you an edge by identifying value bets where the bookmaker's odds don't align with our calculated probabilities.

## Using Predictions Effectively

To make the most of our predictions:

1. Look for high confidence scores (7+)
2. Compare our win probability with the implied probability of the bookmaker's odds
3. Focus on value bets where our probability is significantly higher than the bookmaker's implied probability
4. Consider the key factors and do your own research
5. Practice responsible gambling and never bet more than you can afford to lose

## Prediction Accuracy

We continuously evaluate and improve our prediction models. You can view our historical accuracy in the app, broken down by:

- Sport
- Bet type
- Confidence score
- Time period

Remember that past performance is not a guarantee of future results.
      `,
      tags: ['predictions', 'AI', 'algorithms', 'betting', 'odds'],
      lastUpdated: '2025-02-15',
      relatedArticles: ['getting-started-guide', 'responsible-gambling'],
    },
    {
      id: 'subscription-plans',
      title: 'Subscription Plans and Pricing',
      category: HelpCategory.SUBSCRIPTION,
      content: `
# Subscription Plans and Pricing

AI Sports Edge offers several subscription plans to meet your needs. This article explains the available plans, pricing, and features.

## Available Plans

### Free Plan

- Limited access to predictions (1 per day)
- Basic statistics
- Ad-supported experience
- No cost

### Premium Plan

- Unlimited predictions
- Advanced statistics
- Ad-free experience
- Personalized recommendations
- $9.99/month or $99.99/year (save 17%)

### Pro Plan

- All Premium features
- Early access to predictions
- Expert analysis
- Priority support
- $19.99/month or $199.99/year (save 17%)

## Subscription Management

You can manage your subscription in the app:

1. Go to Profile
2. Tap Subscription
3. View your current plan and billing information
4. Upgrade, downgrade, or cancel your subscription

## Payment Methods

We accept the following payment methods:

- Credit/debit cards (Visa, Mastercard, American Express)
- PayPal
- Apple Pay (iOS only)
- Google Pay (Android only)

## Billing Cycle

Subscriptions are billed at the beginning of each period (monthly or yearly). Your subscription will automatically renew unless you cancel at least 24 hours before the end of the current period.

## Refund Policy

We offer a 7-day money-back guarantee for new subscribers. If you're not satisfied with your subscription within the first 7 days, contact our support team for a full refund.

After the first 7 days, we do not offer refunds for partial subscription periods.

## Changing Plans

You can upgrade your plan at any time. When you upgrade:

- You'll be charged the prorated difference for the remainder of your current billing cycle
- Your new plan will take effect immediately

You can downgrade your plan at any time. When you downgrade:

- Your current plan will remain active until the end of your current billing cycle
- Your new plan will take effect at the next billing date
- No refund is provided for the remaining time on your current plan

## Cancellation

You can cancel your subscription at any time:

1. Go to Profile
2. Tap Subscription
3. Tap Cancel Subscription
4. Follow the prompts to confirm cancellation

When you cancel:

- Your subscription will remain active until the end of your current billing cycle
- You will not be charged for future billing cycles
- You will lose access to premium features when your subscription expires
      `,
      tags: ['subscription', 'pricing', 'plans', 'payment', 'billing'],
      lastUpdated: '2025-03-10',
      relatedArticles: ['getting-started-guide', 'premium-features'],
    },
    {
      id: 'account-settings',
      title: 'Managing Your Account Settings',
      category: HelpCategory.ACCOUNT,
      content: `
# Managing Your Account Settings

This article explains how to manage your account settings in AI Sports Edge.

## Accessing Account Settings

To access your account settings:

1. Tap the Profile tab
2. Tap Settings

## Profile Information

You can update your profile information:

1. Tap Profile Information
2. Update your name, username, or profile picture
3. Tap Save

## Email Address

To change your email address:

1. Tap Email Address
2. Enter your new email address
3. Enter your password to confirm
4. Tap Update Email
5. Verify your new email address by clicking the link in the verification email

## Password

To change your password:

1. Tap Password
2. Enter your current password
3. Enter your new password
4. Confirm your new password
5. Tap Update Password

## Notification Settings

You can customize your notification preferences:

1. Tap Notifications
2. Toggle notifications for:
   - Game start/end
   - New predictions
   - Bet reminders
   - Results
   - Special offers
   - App updates

## Privacy Settings

To manage your privacy settings:

1. Tap Privacy
2. Review and update your data sharing preferences
3. Manage cookie settings
4. Review third-party integrations

## Language Settings

To change your language:

1. Tap Language
2. Select your preferred language
3. Tap Save

## Theme Settings

To change the app theme:

1. Tap Theme
2. Choose Light, Dark, or System Default
3. Tap Save

## Deleting Your Account

If you wish to delete your account:

1. Tap Delete Account
2. Read the information about account deletion
3. Enter your password to confirm
4. Tap Delete Account

Please note that account deletion is permanent and cannot be undone. All your data will be deleted according to our data retention policy.
      `,
      tags: ['account', 'settings', 'profile', 'password', 'email'],
      lastUpdated: '2025-02-28',
      relatedArticles: ['privacy-policy', 'data-security'],
    },
    {
      id: 'responsible-gambling',
      title: 'Responsible Gambling Guidelines',
      category: HelpCategory.BETTING,
      content: `
# Responsible Gambling Guidelines

At AI Sports Edge, we promote responsible gambling. This article provides guidelines and resources to help you gamble responsibly.

## Responsible Gambling Principles

1. **Gambling is entertainment, not a way to make money**
   - View gambling as a form of entertainment with a cost, not as a source of income
   - Never chase losses or try to win back money you've lost

2. **Set limits and stick to them**
   - Set time limits for how long you gamble
   - Set deposit limits for how much you can deposit
   - Set loss limits for how much you can lose
   - Set spending limits for how much you can spend

3. **Only gamble what you can afford to lose**
   - Never gamble with money you need for essential expenses
   - Never borrow money to gamble
   - Never gamble when you're in debt

4. **Keep gambling in balance**
   - Maintain a balance between gambling and other activities
   - Don't let gambling interfere with work, relationships, or responsibilities
   - Take regular breaks from gambling

5. **Don't gamble when emotional**
   - Avoid gambling when you're feeling stressed, depressed, or anxious
   - Don't use gambling as a way to cope with emotional problems
   - Seek help if gambling is affecting your mental health

## Tools for Responsible Gambling

AI Sports Edge provides several tools to help you gamble responsibly:

### Deposit Limits

Set limits on how much you can deposit:

1. Go to Profile
2. Tap Responsible Gambling
3. Tap Deposit Limits
4. Set daily, weekly, or monthly limits

### Time Limits

Set limits on how long you can use the app:

1. Go to Profile
2. Tap Responsible Gambling
3. Tap Time Limits
4. Set daily limits

### Self-Assessment

Take a self-assessment to evaluate your gambling behavior:

1. Go to Profile
2. Tap Responsible Gambling
3. Tap Self-Assessment
4. Answer the questions honestly

### Self-Exclusion

Exclude yourself from the app for a period of time:

1. Go to Profile
2. Tap Responsible Gambling
3. Tap Self-Exclusion
4. Choose a self-exclusion period

## Signs of Problem Gambling

Be aware of these warning signs:

- Spending more time or money on gambling than you can afford
- Finding it difficult to stop or control your gambling
- Lying about your gambling or hiding it from others
- Borrowing money or selling possessions to gamble
- Gambling to escape problems or relieve negative emotions
- Neglecting work, education, or family because of gambling
- Chasing losses to try to win back money
- Feeling anxious, irritable, or restless when not gambling

## Getting Help

If you're concerned about your gambling, help is available:

- **National Problem Gambling Helpline**: 1-800-GAMBLER (1-800-426-2537)
- **Gamblers Anonymous**: www.gamblersanonymous.org
- **National Council on Problem Gambling**: www.ncpgambling.org

Remember, seeking help is a sign of strength, not weakness.
      `,
      tags: ['responsible gambling', 'gambling addiction', 'betting limits', 'self-exclusion'],
      lastUpdated: '2025-01-20',
      relatedArticles: ['betting-guide', 'terms-of-service'],
    },
  ];
};

/**
 * Get mock FAQs
 * @returns Array of mock FAQs
 */
const getMockFAQs = (): FAQ[] => {
  return [
    {
      id: 'what-is-ai-sports-edge',
      question: 'What is AI Sports Edge?',
      answer:
        'AI Sports Edge is an app that uses artificial intelligence to provide sports betting predictions and analysis. Our advanced algorithms analyze vast amounts of data to identify value bets and help you make more informed betting decisions.',
      category: HelpCategory.GETTING_STARTED,
      tags: ['general', 'introduction'],
    },
    {
      id: 'how-accurate-are-predictions',
      question: 'How accurate are the predictions?',
      answer:
        "Our predictions have a historical accuracy rate of approximately 60-65%, depending on the sport and bet type. However, it's important to remember that no prediction system is perfect, and past performance is not a guarantee of future results. We continuously evaluate and improve our models to maintain and enhance accuracy.",
      category: HelpCategory.PREDICTIONS,
      tags: ['predictions', 'accuracy', 'performance'],
    },
    {
      id: 'how-to-cancel-subscription',
      question: 'How do I cancel my subscription?',
      answer:
        'To cancel your subscription: 1) Go to Profile, 2) Tap Subscription, 3) Tap Cancel Subscription, 4) Follow the prompts to confirm cancellation. Your subscription will remain active until the end of your current billing cycle, and you will not be charged for future billing cycles.',
      category: HelpCategory.SUBSCRIPTION,
      tags: ['subscription', 'cancellation', 'billing'],
    },
    {
      id: 'forgot-password',
      question: 'I forgot my password. How do I reset it?',
      answer:
        'To reset your password: 1) On the login screen, tap "Forgot Password", 2) Enter your email address, 3) Check your email for a password reset link, 4) Click the link and follow the instructions to create a new password. If you don\'t receive the email, check your spam folder or contact support.',
      category: HelpCategory.ACCOUNT,
      tags: ['password', 'login', 'account'],
    },
    {
      id: 'app-not-loading',
      question: 'The app is not loading. What should I do?',
      answer:
        'If the app is not loading, try these steps: 1) Close and reopen the app, 2) Check your internet connection, 3) Restart your device, 4) Update the app to the latest version, 5) Clear the app cache (Android) or offload and reinstall the app (iOS). If the problem persists, contact our support team.',
      category: HelpCategory.TROUBLESHOOTING,
      tags: ['technical issue', 'loading', 'crash'],
    },
    {
      id: 'data-privacy',
      question: 'How is my data protected?',
      answer:
        'We take data privacy seriously. Your personal information is encrypted and stored securely. We do not sell your data to third parties. We use industry-standard security measures to protect your data from unauthorized access. For more details, please see our Privacy Policy.',
      category: HelpCategory.PRIVACY_SECURITY,
      tags: ['privacy', 'data', 'security'],
    },
    {
      id: 'payment-methods',
      question: 'What payment methods do you accept?',
      answer:
        'We accept credit/debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay (iOS only), and Google Pay (Android only). All payments are processed securely through our payment providers.',
      category: HelpCategory.PAYMENT,
      tags: ['payment', 'billing', 'subscription'],
    },
    {
      id: 'refund-policy',
      question: 'What is your refund policy?',
      answer:
        "We offer a 7-day money-back guarantee for new subscribers. If you're not satisfied with your subscription within the first 7 days, contact our support team for a full refund. After the first 7 days, we do not offer refunds for partial subscription periods.",
      category: HelpCategory.SUBSCRIPTION,
      tags: ['refund', 'subscription', 'billing'],
    },
    {
      id: 'betting-through-app',
      question: 'Can I place bets directly through the app?',
      answer:
        'No, AI Sports Edge does not handle actual betting. We provide predictions and analysis to help you make informed betting decisions. To place a bet, you need to use a licensed sportsbook or betting platform. You can tap "Bet Now" on a prediction to be redirected to your preferred sportsbook.',
      category: HelpCategory.BETTING,
      tags: ['betting', 'sportsbook', 'wagering'],
    },
    {
      id: 'supported-sports',
      question: 'What sports do you cover?',
      answer:
        'We currently cover major sports including NFL, NBA, MLB, NHL, soccer (Premier League, La Liga, Serie A, Bundesliga, MLS), tennis (Grand Slams and ATP/WTA tournaments), and UFC/MMA. We are continuously expanding our coverage to include more sports and leagues.',
      category: HelpCategory.PREDICTIONS,
      tags: ['sports', 'coverage', 'predictions'],
    },
  ];
};

/**
 * Get mock contact information
 * @returns Array of mock contact information
 */
const getMockContactInfo = (): ContactInfo[] => {
  return [
    {
      method: ContactMethod.EMAIL,
      value: 'support@aisportsedge.com',
      description: 'For general inquiries and support',
    },
    {
      method: ContactMethod.CHAT,
      value: 'in-app',
      availabilityHours: 'Monday-Friday, 9am-5pm EST',
      description: 'For immediate assistance',
    },
    {
      method: ContactMethod.PHONE,
      value: '+1-800-SPORTS-AI',
      availabilityHours: 'Monday-Friday, 9am-5pm EST',
      description: 'For urgent issues',
    },
    {
      method: ContactMethod.SOCIAL,
      value: '@AISportsEdge',
      description: 'Twitter/X support',
    },
  ];
};
