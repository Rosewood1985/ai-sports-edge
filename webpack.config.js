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
  };
  
  return config;
};