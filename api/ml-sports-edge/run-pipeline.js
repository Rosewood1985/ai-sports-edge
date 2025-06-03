/**
 * ML Sports Edge Pipeline Runner
 * Executes the entire data pipeline from collection to model training
 */

require('dotenv').config();
const { fetchAllSportsData } = require('./data/fetch-enhanced');
const { normalizeAllSportsData } = require('./data/normalize');
const { extractAllSportsFeatures } = require('./models/features');
const { trainAllSportsModels } = require('./models/train-enhanced');

/**
 * Run the entire pipeline
 * @param {Object} options - Pipeline options
 */
async function runPipeline(options = {}) {
  const defaultOptions = {
    fetchData: true,
    normalizeData: true,
    extractFeatures: true,
    trainModels: true,
    sports: ['NBA', 'WNBA', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS', 'FORMULA1', 'UFC'],
  };

  const pipelineOptions = { ...defaultOptions, ...options };

  console.log('Starting ML Sports Edge Pipeline...');
  console.log('Pipeline options:', pipelineOptions);

  const startTime = Date.now();

  try {
    // Step 1: Fetch data from all APIs
    if (pipelineOptions.fetchData) {
      console.log('\n=== STEP 1: FETCHING DATA ===\n');
      await fetchAllSportsData();
    } else {
      console.log('\n=== STEP 1: FETCHING DATA [SKIPPED] ===\n');
    }

    // Step 2: Normalize data
    if (pipelineOptions.normalizeData) {
      console.log('\n=== STEP 2: NORMALIZING DATA ===\n');
      await normalizeAllSportsData();
    } else {
      console.log('\n=== STEP 2: NORMALIZING DATA [SKIPPED] ===\n');
    }

    // Step 3: Extract features
    if (pipelineOptions.extractFeatures) {
      console.log('\n=== STEP 3: EXTRACTING FEATURES ===\n');
      await extractAllSportsFeatures();
    } else {
      console.log('\n=== STEP 3: EXTRACTING FEATURES [SKIPPED] ===\n');
    }

    // Step 4: Train models
    if (pipelineOptions.trainModels) {
      console.log('\n=== STEP 4: TRAINING MODELS ===\n');
      await trainAllSportsModels();
    } else {
      console.log('\n=== STEP 4: TRAINING MODELS [SKIPPED] ===\n');
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000 / 60; // in minutes

    console.log(`\nPipeline completed successfully in ${duration.toFixed(2)} minutes`);

    return {
      success: true,
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error running pipeline:', error);

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run the pipeline for a specific sport
 * @param {string} sport - Sport key
 * @param {Object} options - Pipeline options
 */
async function runPipelineForSport(sport, options = {}) {
  return runPipeline({
    ...options,
    sports: [sport],
  });
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    fetchData: true,
    normalizeData: true,
    extractFeatures: true,
    trainModels: true,
    sports: ['NBA', 'WNBA', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS', 'FORMULA1', 'UFC'],
  };

  // Check for step flags
  if (args.includes('--no-fetch')) {
    options.fetchData = false;
  }

  if (args.includes('--no-normalize')) {
    options.normalizeData = false;
  }

  if (args.includes('--no-features')) {
    options.extractFeatures = false;
  }

  if (args.includes('--no-train')) {
    options.trainModels = false;
  }

  // Check for sport filter
  const sportIndex = args.findIndex(arg => arg === '--sport');
  if (sportIndex !== -1 && args.length > sportIndex + 1) {
    const sport = args[sportIndex + 1].toUpperCase();
    if (options.sports.includes(sport)) {
      options.sports = [sport];
    } else {
      console.warn(`Warning: Unknown sport "${sport}". Using all sports.`);
    }
  }

  return options;
}

// Execute if run directly
if (require.main === module) {
  const options = parseArgs();

  runPipeline(options)
    .then(result => {
      if (result.success) {
        console.log('Pipeline execution completed successfully');
        process.exit(0);
      } else {
        console.error('Pipeline execution failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error in pipeline execution:', error);
      process.exit(1);
    });
}

module.exports = {
  runPipeline,
  runPipelineForSport,
};
