const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add atomic architecture aliases
  config.resolve.alias = {
    ...config.resolve.alias,
    'atomic': path.resolve(__dirname, 'atomic'),
    'atomic/atoms': path.resolve(__dirname, 'atomic/atoms'),
    'atomic/molecules': path.resolve(__dirname, 'atomic/molecules'),
    'atomic/organisms': path.resolve(__dirname, 'atomic/organisms'),
    'atomic/templates': path.resolve(__dirname, 'atomic/templates'),
    'atomic/pages': path.resolve(__dirname, 'atomic/pages'),
  };

  return config;
};
