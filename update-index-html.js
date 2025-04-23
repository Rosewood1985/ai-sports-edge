// Script to update index.html with service worker registration
const fs = require('fs');

try {
  // Read the index.html file
  const indexHtmlPath = './public/index.html';
  
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Check if service worker registration is already added
    if (!indexHtmlContent.includes('register-service-worker.js')) {
      // Add the service worker registration script before the closing head tag
      indexHtmlContent = indexHtmlContent.replace(
        '</head>',
        '    <script src="/register-service-worker.js"></script>\n</head>'
      );
      
      // Write the updated index.html back to disk
      fs.writeFileSync(indexHtmlPath, indexHtmlContent);
      console.log('Added service worker registration to index.html');
    } else {
      console.log('Service worker registration already exists in index.html');
    }
  } else {
    console.log('index.html not found in public directory');
    
    // Create a basic index.html file with service worker registration
    const basicIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Sports Edge</title>
    <script src="/register-service-worker.js"></script>
</head>
<body>
    <div id="root"></div>
    <script src="/app.js"></script>
</body>
</html>`;
    
    fs.writeFileSync(indexHtmlPath, basicIndexHtml);
    console.log('Created new index.html with service worker registration');
  }
} catch (error) {
  console.error('Error updating index.html:', error.message);
  process.exit(1);
}