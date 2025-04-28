/**
 * Script to open the AI Sports Edge app in Expo Go
 * 
 * This script will:
 * 1. Generate a QR code for the app
 * 2. Open the QR code in a browser
 * 3. Provide instructions for opening the app in Expo Go
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// App URL
const APP_URL = 'exp://exp.host/@aisportsedge/ai-sports-edge';

// Create HTML file with QR code
const createQRCodeHTML = () => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>AI Sports Edge - Expo QR Code</title>
    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #121212;
            color: white;
        }
        .container {
            background-color: #1e1e1e;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h1 {
            color: #0088ff;
            margin-bottom: 20px;
            text-shadow: 0 0 5px rgba(0, 136, 255, 0.9);
        }
        .qr-container {
            margin: 20px 0;
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            display: inline-block;
        }
        .instructions {
            margin-top: 20px;
            color: #b0b0b0;
            max-width: 500px;
            line-height: 1.5;
        }
        .url {
            color: #0088ff;
            font-weight: bold;
            margin-top: 10px;
            word-break: break-all;
        }
        .button {
            background: linear-gradient(135deg, #0088ff 0%, #0066cc 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 20px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 0 10px rgba(0, 136, 255, 0.7);
            transition: all 0.3s ease;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 0 15px rgba(0, 136, 255, 0.9);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI Sports Edge</h1>
        <div class="qr-container" id="qrcode"></div>
        <div class="instructions">
            <p>Scan this QR code with your mobile device's camera app to open the project in Expo Go.</p>
            <p>Make sure you have the <a href="https://expo.dev/client" style="color: #0088ff;">Expo Go</a> app installed on your device.</p>
            <p>The QR code connects to:</p>
            <div class="url">${APP_URL}</div>
        </div>
        <button class="button" onclick="window.location.href='${APP_URL}'">Open in Expo Go</button>
    </div>

    <script>
        // Generate QR code
        function generateQRCode() {
            const qr = qrcode(0, 'L');
            qr.addData('${APP_URL}');
            qr.make();
            
            // Display QR code
            document.getElementById('qrcode').innerHTML = qr.createImgTag(8);
        }
        
        // Generate QR code when page loads
        window.onload = generateQRCode;
    </script>
</body>
</html>
  `;

  // Write HTML to file
  fs.writeFileSync(path.join(__dirname, 'expo-qr.html'), html);
  
  return path.join(__dirname, 'expo-qr.html');
}

// Main function
const main = async () => {
  console.log('Generating QR code for AI Sports Edge app...');
  
  // Create QR code HTML
  const htmlPath = createQRCodeHTML();
  
  // Open in browser
  console.log('Opening QR code in browser...');
  
  // Open the HTML file in the default browser
  const openCommand = process.platform === 'win32' 
    ? `start ${htmlPath}`
    : process.platform === 'darwin' 
      ? `open ${htmlPath}` 
      : `xdg-open ${htmlPath}`;
  
  exec(openCommand, (error) => {
    if (error) {
      console.error('Error opening browser:', error);
      return;
    }
    
    console.log('\nInstructions:');
    console.log('1. Scan the QR code with your mobile device\'s camera');
    console.log('2. Open the link in Expo Go');
    console.log('3. Alternatively, you can open Expo Go and enter the URL manually:');
    console.log(`   ${APP_URL}`);
  });
}

// Run the main function
main().catch(console.error);