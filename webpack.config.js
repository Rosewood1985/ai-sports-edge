const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          // Add any packages that need transpiling
        ],
      },
    },
    argv
  );

  // Set output path to 'dist' to match Firebase configuration
  config.output.path = path.resolve(__dirname, 'dist');

  // Fix the node configuration
  config.node = {
    __dirname: false,
    __filename: false,
    global: false,
  };

  return config;
};
