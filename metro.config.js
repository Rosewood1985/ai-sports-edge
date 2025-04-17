// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude xcode-git-ai-sports-edge directory to fix Haste module naming collision
config.resolver.blockList = [
  new RegExp(path.resolve(__dirname, 'xcode-git-ai-sports-edge') + '/.*'),
];

// Also exclude any other directories that might cause conflicts
config.watchFolders = [
  path.resolve(__dirname, '.'),
];

// Exclude specific problematic files
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];

module.exports = config;