const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const fs = require('fs');

// Load environment variables directly from .env.production
require('dotenv').config({ path: './.env.production' });

// Read Firebase config from .env.production
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  recaptchaSiteKey: process.env.FIREBASE_RECAPTCHA_SITE_KEY
};

// Log the loaded environment variables
console.log('Loaded Firebase config for webpack build:', 
  Object.keys(firebaseConfig).reduce((acc, key) => {
    acc[key] = firebaseConfig[key] ? 'Defined' : 'Undefined';
    return acc;
  }, {})
);

module.exports = {
  mode: 'production',
  entry: './src/index.js', // Update this to your entry point
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    publicPath: '/',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: false, // Keep console logs for debugging
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `vendor.${packageName.replace('@', '')}`;
          },
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'vendor.react',
          chunks: 'all',
          priority: 10,
        },
        redux: {
          test: /[\\/]node_modules[\\/](redux|react-redux|redux-thunk)[\\/]/,
          name: 'vendor.redux',
          chunks: 'all',
          priority: 10,
        },
      },
    },
    runtimeChunk: 'single',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }],
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-object-rest-spread',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(scss|sass)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024,
          },
        },
        generator: {
          filename: 'images/[name].[contenthash][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash][ext]',
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].[contenthash].css',
      chunkFilename: 'styles/[name].[contenthash].chunk.css',
    }),
    // Define environment variables as string literals
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'https://api.aisportsedge.com'),
      // Directly inject Firebase config as string literals
      'process.env.FIREBASE_API_KEY': JSON.stringify(firebaseConfig.apiKey),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(firebaseConfig.authDomain),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(firebaseConfig.projectId),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(firebaseConfig.storageBucket),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(firebaseConfig.messagingSenderId),
      'process.env.FIREBASE_APP_ID': JSON.stringify(firebaseConfig.appId),
      'process.env.FIREBASE_RECAPTCHA_SITE_KEY': JSON.stringify(firebaseConfig.recaptchaSiteKey),
    }),
    // Create a global Firebase config object that doesn't rely on process.env
    new webpack.BannerPlugin({
      banner: `
        window.FIREBASE_CONFIG = {
          apiKey: "${firebaseConfig.apiKey || ''}",
          authDomain: "${firebaseConfig.authDomain || ''}",
          projectId: "${firebaseConfig.projectId || ''}",
          storageBucket: "${firebaseConfig.storageBucket || ''}",
          messagingSenderId: "${firebaseConfig.messagingSenderId || ''}",
          appId: "${firebaseConfig.appId || ''}",
          recaptchaSiteKey: "${firebaseConfig.recaptchaSiteKey || ''}"
        };
      `,
      raw: true,
      entryOnly: true,
    }),
    // Still use dotenv-webpack as a backup
    new Dotenv({
      path: './.env.production',
      safe: true,
      systemvars: true,
      defaults: false,
    }),
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      // Inject Firebase config into HTML
      templateParameters: {
        firebaseConfig: JSON.stringify(firebaseConfig, null, 2)
      }
    }),
    // Add a plugin to generate the diagnostic files
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('DiagnosticPlugin', (compilation) => {
          // Create a diagnostic info file
          const diagnosticInfo = {
            buildTime: new Date().toISOString(),
            nodeEnv: process.env.NODE_ENV,
            firebaseConfigDefined: Object.keys(firebaseConfig).reduce((acc, key) => {
              acc[key] = !!firebaseConfig[key];
              return acc;
            }, {})
          };
          
          fs.writeFileSync(
            path.join(compiler.outputPath, 'build-diagnostic.json'),
            JSON.stringify(diagnosticInfo, null, 2)
          );
          
          console.log('Diagnostic information written to build-diagnostic.json');
        });
      }
    }
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@screens': path.resolve(__dirname, 'src/screens'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
  },
  performance: {
    hints: 'warning',
    maxAssetSize: 250 * 1024,
    maxEntrypointSize: 500 * 1024,
  },
};