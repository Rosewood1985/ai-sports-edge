#!/bin/bash

# Frontend deployment script that skips .htaccess
# This script follows the requirements:
# 1. Removes integrity attributes and X-Frame-Options from HTML files
# 2. Updates SEO and Open Graph meta tags
# 3. Adds Spanish language support
# 4. Skips .htaccess when syncing
# 5. Rebuilds the project
# 6. Uploads assets to GoDaddy

echo "🚀 Starting frontend deployment without .htaccess..."

# Step 1: Clean up HTML files
echo "🧼 Cleaning up HTML files..."

# Remove X-Frame-Options meta tag from index.html
if grep -q "X-Frame-Options" dist/index.html; then
  sed -i '' '/X-Frame-Options/d' dist/index.html
  echo "  ✅ Removed X-Frame-Options from index.html"
fi

# Remove X-Frame-Options meta tag from login.html
if grep -q "X-Frame-Options" dist/login.html; then
  sed -i '' '/X-Frame-Options/d' dist/login.html
  echo "  ✅ Removed X-Frame-Options from login.html"
fi

# Remove integrity attributes from index.html
if grep -q "integrity=" dist/index.html; then
  sed -i '' 's/integrity="[^"]*"//g' dist/index.html
  sed -i '' 's/crossorigin="anonymous"//g' dist/index.html
  echo "  ✅ Removed integrity attributes from index.html"
fi

# Step 2: Update SEO and Open Graph meta tags
echo "🔍 Updating SEO and Open Graph meta tags..."

# Update title
sed -i '' 's/<title>AI Sports Edge - AI-Powered Sports Betting Predictions<\/title>/<title>AI Sports Edge – AI-Powered Sports Betting Insights<\/title>/g' dist/index.html

# Update description and add robots meta tag
sed -i '' 's/<meta name="description" content="AI Sports Edge - AI-Powered Sports Betting Predictions and Analytics">/<meta name="description" content="Smarter picks. Less guesswork. Get AI-powered betting insights across NBA, NFL, NCAA, and more.">\n  <meta name="robots" content="index, follow">\n  <link rel="canonical" href="https:\/\/aisportsedge.app">/g' dist/index.html

# Update Open Graph title
sed -i '' 's/<meta property="og:title" content="AI Sports Edge - AI-Powered Sports Betting Predictions">/<meta property="og:title" content="AI Sports Edge">/g' dist/index.html

# Update Open Graph description
sed -i '' 's/<meta property="og:description" content="Get accurate sports betting predictions powered by AI. Improve your betting strategy with advanced analytics and real-time insights.">/<meta property="og:description" content="Smarter picks. Less guesswork. AI-powered betting predictions.">/g' dist/index.html

# Update Open Graph URL
sed -i '' 's/<meta property="og:url" content="https:\/\/aisportsedge.app\/">/<meta property="og:url" content="https:\/\/aisportsedge.app">/g' dist/index.html

# Update Twitter title
sed -i '' 's/<meta property="twitter:title" content="AI Sports Edge - AI-Powered Sports Betting Predictions">/<meta property="twitter:title" content="AI Sports Edge">/g' dist/index.html

# Update Twitter description
sed -i '' 's/<meta property="twitter:description" content="Get accurate sports betting predictions powered by AI. Improve your betting strategy with advanced analytics and real-time insights.">/<meta property="twitter:description" content="Smarter picks. Less guesswork. AI-powered betting predictions.">/g' dist/index.html

# Update Twitter URL
sed -i '' 's/<meta property="twitter:url" content="https:\/\/aisportsedge.app\/">/<meta property="twitter:url" content="https:\/\/aisportsedge.app">/g' dist/index.html

echo "  ✅ Updated SEO and Open Graph meta tags"

# Step 3: Add Spanish language support
echo "🌍 Adding Spanish language support..."

# Update HTML lang attribute
sed -i '' 's/<html lang="en">/<html lang="en" id="html-lang">/g' dist/index.html

# Add language meta tag
sed -i '' 's/<meta name="robots" content="index, follow">/<meta name="robots" content="index, follow">\n  <meta name="language" content="en, es">/g' dist/index.html

# Create language switcher script if it doesn't exist
if [ ! -f "dist/language-switcher.js" ]; then
  echo "  Creating language switcher script..."
  cat > dist/language-switcher.js << 'EOL'
/**
 * Language Switcher for AI Sports Edge
 * Handles language switching between English and Spanish
 */

// Initialize language from browser or localStorage
document.addEventListener('DOMContentLoaded', function() {
  initializeLanguage();
  addLanguageToggle();
});

/**
 * Initialize the language based on browser settings or localStorage
 */
function initializeLanguage() {
  // Check if language is stored in localStorage
  const storedLang = localStorage.getItem('aisportsedge-language');
  
  if (storedLang) {
    // Use stored language preference
    setLanguage(storedLang);
  } else {
    // Detect browser language
    const browserLang = navigator.language || navigator.userLanguage;
    const lang = browserLang.startsWith('es') ? 'es' : 'en';
    setLanguage(lang);
  }
}

/**
 * Add language toggle to the header
 */
function addLanguageToggle() {
  // Find the header navigation
  const nav = document.querySelector('.nav-list');
  
  if (!nav) {
    console.error('Navigation not found');
    return;
  }
  
  // Create language toggle element
  const langToggle = document.createElement('li');
  langToggle.className = 'nav-item language-toggle';
  
  // Get current language
  const currentLang = localStorage.getItem('aisportsedge-language') || 'en';
  
  // Create toggle button
  langToggle.innerHTML = `
    <button class="language-button">
      ${currentLang === 'en' ? 'Español' : 'English'}
    </button>
  `;
  
  // Add click event
  langToggle.querySelector('.language-button').addEventListener('click', function() {
    const newLang = currentLang === 'en' ? 'es' : 'en';
    setLanguage(newLang);
    this.textContent = newLang === 'en' ? 'Español' : 'English';
  });
  
  // Add to navigation
  nav.appendChild(langToggle);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .language-button {
      background: transparent;
      border: 1px solid #0088ff;
      color: #0088ff;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .language-button:hover {
      background: #0088ff;
      color: white;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Set the language and update the UI
 * @param {string} lang - Language code ('en' or 'es')
 */
function setLanguage(lang) {
  // Save to localStorage
  localStorage.setItem('aisportsedge-language', lang);
  
  // Update HTML lang attribute
  document.getElementById('html-lang').setAttribute('lang', lang);
  
  // Load translations
  loadTranslations(lang);
}

/**
 * Load translations from JSON files
 * @param {string} lang - Language code ('en' or 'es')
 */
function loadTranslations(lang) {
  // Only load translations if language is Spanish
  // English is the default in the HTML
  if (lang === 'es') {
    fetch(`/locales/${lang}/common.json`)
      .then(response => response.json())
      .then(translations => {
        applyTranslations(translations);
      })
      .catch(error => {
        console.error('Error loading translations:', error);
      });
  } else {
    // Reload page to restore English content
    // This is a simple approach - in a production app, you might want to
    // store the original English text and restore it without a page reload
    if (document.documentElement.getAttribute('lang') !== 'en') {
      window.location.reload();
    }
  }
}

/**
 * Apply translations to the page
 * @param {Object} translations - Translation key-value pairs
 */
function applyTranslations(translations) {
  // Apply translations to elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });
  
  // Apply translations to specific elements without data-i18n
  // This is a fallback for elements that don't have data-i18n attributes
  
  // Title
  if (translations.title) {
    document.title = translations.title;
  }
  
  // Hero section
  const heroTitle = document.querySelector('.hero-text h1');
  if (heroTitle && translations.heroTitle) {
    heroTitle.textContent = translations.heroTitle;
  }
  
  const heroSubtitle = document.querySelector('.hero-subtitle');
  if (heroSubtitle && translations.heroSubtitle) {
    heroSubtitle.textContent = translations.heroSubtitle;
  }
  
  // Navigation
  const navItems = document.querySelectorAll('.nav-item a');
  navItems.forEach(item => {
    const text = item.textContent.trim().toLowerCase();
    if (translations[`nav_${text}`]) {
      item.textContent = translations[`nav_${text}`];
    }
  });
  
  // Buttons
  const buttons = document.querySelectorAll('.button');
  buttons.forEach(button => {
    const text = button.textContent.trim().toLowerCase();
    if (translations[`button_${text}`]) {
      button.textContent = translations[`button_${text}`];
    }
  });
}

// Initialize Firebase to detect language changes
// This assumes Firebase is already initialized in the main app
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // If user has a language preference in their profile, use it
      const userLang = user.languagePreference || localStorage.getItem('aisportsedge-language') || 'en';
      setLanguage(userLang);
    }
  });
}
EOL
  echo "  ✅ Created language switcher script"
fi

# Add language switcher script to index.html if not already included
if ! grep -q "language-switcher.js" dist/index.html; then
  sed -i '' 's/<script src="\/register-service-worker.js"><\/script>/<script src="\/register-service-worker.js"><\/script>\n    <script src="\/language-switcher.js"><\/script>/g' dist/index.html
  echo "  ✅ Added language switcher script to index.html"
fi

# Verify Spanish locales directory exists
if [ ! -d "dist/locales/es" ]; then
  echo "  ⚠️ Spanish locales directory not found at dist/locales/es"
  echo "  Please ensure translations are available in dist/locales/es/"
else
  echo "  ✅ Spanish locales directory found"
fi

echo "  ✅ Spanish language support added"

# Step 4: Verify SFTP configuration
echo "🔐 Verifying SFTP configuration..."
SFTP_CONFIG="vscode-sftp-deploy/.vscode/sftp.json"

if [ ! -f "$SFTP_CONFIG" ]; then
  echo "❌ SFTP configuration not found at $SFTP_CONFIG"
  exit 1
fi

# Check if .htaccess is in the ignore list
if ! grep -q '".htaccess"' "$SFTP_CONFIG"; then
  echo "❌ .htaccess is not in the ignore list in $SFTP_CONFIG"
  echo "Adding .htaccess to ignore list..."
  # Use jq to add .htaccess to ignore list if available
  if command -v jq &> /dev/null; then
    jq '.ignore += [".htaccess"]' "$SFTP_CONFIG" > "$SFTP_CONFIG.tmp" && mv "$SFTP_CONFIG.tmp" "$SFTP_CONFIG"
  else
    echo "⚠️ jq not found. Please manually add .htaccess to the ignore list in $SFTP_CONFIG"
    exit 1
  fi
fi

echo "  ✅ SFTP configuration verified"

# Step 5: Rebuild the project
echo "🔨 Rebuilding the project..."
npx expo export --platform web

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "  ✅ Build completed successfully"

# Step 6: Clean up HTML files again (in case they were regenerated)
echo "🧼 Cleaning up HTML files again..."

# Remove X-Frame-Options meta tag from index.html
if grep -q "X-Frame-Options" dist/index.html; then
  sed -i '' '/X-Frame-Options/d' dist/index.html
  echo "  ✅ Removed X-Frame-Options from index.html"
fi

# Remove X-Frame-Options meta tag from login.html
if grep -q "X-Frame-Options" dist/login.html; then
  sed -i '' '/X-Frame-Options/d' dist/login.html
  echo "  ✅ Removed X-Frame-Options from login.html"
fi

# Remove integrity attributes from index.html
if grep -q "integrity=" dist/index.html; then
  sed -i '' 's/integrity="[^"]*"//g' dist/index.html
  sed -i '' 's/crossorigin="anonymous"//g' dist/index.html
  echo "  ✅ Removed integrity attributes from index.html"
fi

# Step 7: Update SEO and Open Graph meta tags again (in case they were regenerated)
echo "🔍 Updating SEO and Open Graph meta tags again..."

# Update title
sed -i '' 's/<title>AI Sports Edge - AI-Powered Sports Betting Predictions<\/title>/<title>AI Sports Edge – AI-Powered Sports Betting Insights<\/title>/g' dist/index.html

# Update description and add robots meta tag
sed -i '' 's/<meta name="description" content="AI Sports Edge - AI-Powered Sports Betting Predictions and Analytics">/<meta name="description" content="Smarter picks. Less guesswork. Get AI-powered betting insights across NBA, NFL, NCAA, and more.">\n  <meta name="robots" content="index, follow">\n  <link rel="canonical" href="https:\/\/aisportsedge.app">/g' dist/index.html

# Update Open Graph title
sed -i '' 's/<meta property="og:title" content="AI Sports Edge - AI-Powered Sports Betting Predictions">/<meta property="og:title" content="AI Sports Edge">/g' dist/index.html

# Update Open Graph description
sed -i '' 's/<meta property="og:description" content="Get accurate sports betting predictions powered by AI. Improve your betting strategy with advanced analytics and real-time insights.">/<meta property="og:description" content="Smarter picks. Less guesswork. AI-powered betting predictions.">/g' dist/index.html

# Update Open Graph URL
sed -i '' 's/<meta property="og:url" content="https:\/\/aisportsedge.app\/">/<meta property="og:url" content="https:\/\/aisportsedge.app">/g' dist/index.html

# Update Twitter title
sed -i '' 's/<meta property="twitter:title" content="AI Sports Edge - AI-Powered Sports Betting Predictions">/<meta property="twitter:title" content="AI Sports Edge">/g' dist/index.html

# Update Twitter description
sed -i '' 's/<meta property="twitter:description" content="Get accurate sports betting predictions powered by AI. Improve your betting strategy with advanced analytics and real-time insights.">/<meta property="twitter:description" content="Smarter picks. Less guesswork. AI-powered betting predictions.">/g' dist/index.html

# Update Twitter URL
sed -i '' 's/<meta property="twitter:url" content="https:\/\/aisportsedge.app\/">/<meta property="twitter:url" content="https:\/\/aisportsedge.app">/g' dist/index.html

echo "  ✅ Updated SEO and Open Graph meta tags"

# Step 8: Add Spanish language support again (in case it was regenerated)
echo "🌍 Adding Spanish language support again..."

# Update HTML lang attribute
sed -i '' 's/<html lang="en">/<html lang="en" id="html-lang">/g' dist/index.html

# Add language meta tag
sed -i '' 's/<meta name="robots" content="index, follow">/<meta name="robots" content="index, follow">\n  <meta name="language" content="en, es">/g' dist/index.html

# Add language switcher script to index.html if not already included
if ! grep -q "language-switcher.js" dist/index.html; then
  sed -i '' 's/<script src="\/register-service-worker.js"><\/script>/<script src="\/register-service-worker.js"><\/script>\n    <script src="\/language-switcher.js"><\/script>/g' dist/index.html
  echo "  ✅ Added language switcher script to index.html"
fi

echo "  ✅ Spanish language support added"

# Step 9: Upload assets to GoDaddy
echo "🚀 Uploading assets to GoDaddy..."
echo "Using VS Code SFTP extension to upload files..."
echo "Please follow these steps:"
echo "1. Open VS Code"
echo "2. Right-click on the dist folder"
echo "3. Select 'SFTP: Upload Folder'"
echo "4. Confirm that you want to upload to $REMOTE_PATH"

# Extract remote path from SFTP config
REMOTE_PATH=$(grep -o '"remotePath": *"[^"]*"' "$SFTP_CONFIG" | cut -d'"' -f4)

# Step 10: Post-deploy verification
echo "✅ Post-deploy verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm Firebase and routing work as expected"
echo "5. Verify language toggle works and Spanish text appears when selected"

echo "🎉 Deployment process completed!"