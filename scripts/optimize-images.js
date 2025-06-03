#!/usr/bin/env node

/**
 * Image Optimization Script
 *
 * This script optimizes all images in the src/assets directory for production.
 * It uses sharp to resize, compress, and convert images to modern formats.
 *
 * Usage:
 *   node scripts/optimize-images.js
 *
 * Options:
 *   --quality=80     Set the quality of the output images (default: 80)
 *   --webp           Convert images to WebP format
 *   --avif           Convert images to AVIF format
 *   --resize         Resize images to specified dimensions
 *   --width=1920     Maximum width for resized images
 *   --height=1080    Maximum height for resized images
 */

const chalk = require('chalk');
const { program } = require('commander');
const fs = require('fs');
const glob = require('glob');
const ora = require('ora');
const path = require('path');
const sharp = require('sharp');

// Parse command line arguments
program
  .option('--quality <number>', 'Quality of the output images', 80)
  .option('--webp', 'Convert images to WebP format', false)
  .option('--avif', 'Convert images to AVIF format', false)
  .option('--resize', 'Resize images to specified dimensions', false)
  .option('--width <number>', 'Maximum width for resized images', 1920)
  .option('--height <number>', 'Maximum height for resized images', 1080)
  .parse(process.argv);

const options = program.opts();

// Configuration
const quality = parseInt(options.quality, 10);
const convertToWebP = options.webp;
const convertToAVIF = options.avif;
const resizeImages = options.resize;
const maxWidth = parseInt(options.width, 10);
const maxHeight = parseInt(options.height, 10);

// Source and destination directories
const sourceDir = path.join(__dirname, '../src/assets');
const outputDir = path.join(__dirname, '../src/assets/optimized');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all image files
const getImageFiles = () => {
  return glob.sync(`${sourceDir}/**/*.{jpg,jpeg,png,gif}`, {
    ignore: [`${outputDir}/**/*`],
  });
};

// Optimize a single image
const optimizeImage = async filePath => {
  const fileName = path.basename(filePath);
  const fileExt = path.extname(filePath).toLowerCase();
  const fileNameWithoutExt = path.basename(filePath, fileExt);
  const relativePath = path.relative(sourceDir, path.dirname(filePath));
  const outputPath = path.join(outputDir, relativePath);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Create sharp instance
  let image = sharp(filePath);

  // Get image metadata
  const metadata = await image.metadata();

  // Resize image if needed
  if (resizeImages) {
    const width = metadata.width;
    const height = metadata.height;

    if (width > maxWidth || height > maxHeight) {
      // Calculate new dimensions while maintaining aspect ratio
      const aspectRatio = width / height;
      let newWidth = maxWidth;
      let newHeight = Math.round(newWidth / aspectRatio);

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = Math.round(newHeight * aspectRatio);
      }

      image = image.resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }

  // Optimize original format
  const outputFilePath = path.join(outputPath, fileName);

  // Apply appropriate optimization based on file type
  if (fileExt === '.jpg' || fileExt === '.jpeg') {
    await image.jpeg({ quality, progressive: true, optimizeCoding: true }).toFile(outputFilePath);
  } else if (fileExt === '.png') {
    await image
      .png({ quality, progressive: true, compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outputFilePath);
  } else if (fileExt === '.gif') {
    // GIFs are just copied as sharp doesn't optimize them well
    fs.copyFileSync(filePath, outputFilePath);
  }

  // Convert to WebP if requested
  if (convertToWebP) {
    const webpFilePath = path.join(outputPath, `${fileNameWithoutExt}.webp`);
    await image.webp({ quality, effort: 6 }).toFile(webpFilePath);
  }

  // Convert to AVIF if requested
  if (convertToAVIF) {
    const avifFilePath = path.join(outputPath, `${fileNameWithoutExt}.avif`);
    await image.avif({ quality, effort: 9 }).toFile(avifFilePath);
  }

  // Get file sizes
  const originalSize = fs.statSync(filePath).size;
  const optimizedSize = fs.statSync(outputFilePath).size;
  const savings = originalSize - optimizedSize;
  const savingsPercentage = (savings / originalSize) * 100;

  return {
    fileName,
    originalSize,
    optimizedSize,
    savings,
    savingsPercentage,
  };
};

// Main function
const main = async () => {
  const spinner = ora('Finding images...').start();

  try {
    const imageFiles = getImageFiles();

    if (imageFiles.length === 0) {
      spinner.fail('No images found.');
      return;
    }

    spinner.text = `Found ${imageFiles.length} images. Optimizing...`;

    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    // Process images in batches to avoid memory issues
    const batchSize = 10;
    const batches = Math.ceil(imageFiles.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, imageFiles.length);
      const batch = imageFiles.slice(start, end);

      spinner.text = `Optimizing batch ${i + 1}/${batches} (${start + 1}-${end} of ${imageFiles.length})...`;

      const results = await Promise.all(batch.map(optimizeImage));

      for (const result of results) {
        totalOriginalSize += result.originalSize;
        totalOptimizedSize += result.optimizedSize;
      }
    }

    const totalSavings = totalOriginalSize - totalOptimizedSize;
    const totalSavingsPercentage = (totalSavings / totalOriginalSize) * 100;

    spinner.succeed('Image optimization complete!');

    console.log('\nOptimization Summary:');
    console.log(`Total images processed: ${chalk.cyan(imageFiles.length)}`);
    console.log(`Original size: ${chalk.yellow(formatBytes(totalOriginalSize))}`);
    console.log(`Optimized size: ${chalk.green(formatBytes(totalOptimizedSize))}`);
    console.log(
      `Size reduction: ${chalk.green(formatBytes(totalSavings))} (${chalk.green(totalSavingsPercentage.toFixed(2))}%)`
    );

    if (convertToWebP) {
      console.log(`WebP versions: ${chalk.cyan('Created')}`);
    }

    if (convertToAVIF) {
      console.log(`AVIF versions: ${chalk.cyan('Created')}`);
    }

    console.log('\nOptimized images are saved in:');
    console.log(chalk.cyan(outputDir));
  } catch (error) {
    spinner.fail('Image optimization failed.');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
};

// Format bytes to human-readable format
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Run the script
main().catch(error => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});
