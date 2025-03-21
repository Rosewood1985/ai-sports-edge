const path = require('path');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  // Get the default Expo webpack config
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Customize the config to use our web directory
  config.entry = {
    app: path.resolve(__dirname, 'web/index.js'),
  };
  
  // Set the HTML template to our custom index.html
  config.plugins.forEach(plugin => {
    if (plugin.constructor.name === 'HtmlWebpackPlugin') {
      plugin.options.template = path.resolve(__dirname, 'web/index.html');
    }
  });
  
  // Add resolve aliases for web-specific components
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native': 'react-native-web',
    '@web': path.resolve(__dirname, 'web'),
    // Add specific aliases for React Native components that might be causing issues
    'react-native/Libraries/Components/TextInput/TextInputState': 'react-native-web/dist/exports/TextInput/TextInputState',
    'react-native/Libraries/Utilities/Platform': 'react-native-web/dist/exports/Platform',
    'react-native/Libraries/Components/View/ViewPropTypes': 'react-native-web/dist/exports/View/ViewPropTypes',
    // Add aliases for any other problematic modules
    'react-native-gesture-handler': 'react-native-web/dist/modules/GestureResponder',
  };
  
  // Add fallbacks for node modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    'crypto': require.resolve('crypto-browserify'),
    'stream': require.resolve('stream-browserify'),
    'path': require.resolve('path-browserify'),
    'fs': false,
    'net': false,
    'tls': false,
  };
  
  // Increase performance budget to avoid warnings
  if (config.performance) {
    config.performance.maxAssetSize = 1000000;
    config.performance.maxEntrypointSize = 1000000;
  }
  
  return config;
};