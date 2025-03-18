# AI Sports Edge Web Deployment

This directory contains the web version of the AI Sports Edge app. The web version serves as a landing page and provides instructions on how to access the mobile app.

## Local Development

To run the web version locally:

1. Start the server:
   ```
   node server.js
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Deployment Options

### Option 1: Firebase Hosting (Recommended)

1. Install Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Initialize Firebase in your project:
   ```
   firebase init
   ```
   - Select "Hosting"
   - Choose your Firebase project or create a new one
   - Specify "public" as your public directory
   - Configure as a single-page app: Yes
   - Set up automatic builds: No

4. Deploy to Firebase:
   ```
   firebase deploy
   ```

5. Your site will be live at:
   ```
   https://your-project-id.web.app
   ```

### Option 2: GitHub Pages

1. Create a new repository on GitHub

2. Initialize Git in your project:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. Connect to your GitHub repository:
   ```
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

4. Enable GitHub Pages in your repository settings and select the main branch /docs folder

5. Copy the contents of the public directory to a docs directory:
   ```
   cp -r public docs
   ```

6. Commit and push the changes:
   ```
   git add docs
   git commit -m "Add docs for GitHub Pages"
   git push
   ```

7. Your site will be live at:
   ```
   https://yourusername.github.io/your-repo
   ```

### Option 3: Netlify

1. Create a netlify.toml file in your project root:
   ```
   [build]
     publish = "public"
   ```

2. Push your code to GitHub

3. Log in to Netlify and select "New site from Git"

4. Choose your repository and configure the build settings

5. Deploy the site

## Updating the Web Version

To update the web version:

1. Modify the files in the public directory
2. Redeploy using your chosen deployment method