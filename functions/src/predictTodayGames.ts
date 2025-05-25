import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { spawn } from 'child_process';
import { logger } from 'firebase-functions';
import * as https from 'https';
import * as http from 'http';
import { wrapScheduledFunction, trackApiCall, trackDatabaseOperation } from '../sentryCronConfig';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

/**
 * Firebase Cloud Function that runs daily to predict game outcomes
 * using the trained ML model.
 */
export const predictTodayGames = functions.pubsub
  .schedule(process.env.FUNCTIONS_CONFIG_PREDICTION_SCHEDULE || '0 10 * * *') // Use Remote Config value or default
  .timeZone('America/New_York')
  .onRun(wrapScheduledFunction(
    'predictTodayGames',
    process.env.FUNCTIONS_CONFIG_PREDICTION_SCHEDULE || '0 10 * * *',
    async (context) => {
    logger.info('Starting predictTodayGames function');
    
    try {
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get tomorrow's date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Convert to Firestore timestamps
      const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
      const tomorrowTimestamp = admin.firestore.Timestamp.fromDate(tomorrow);
      
      logger.info(`Fetching games scheduled between ${today.toISOString()} and ${tomorrow.toISOString()}`);
      
      // Query games scheduled for today
      const gamesRef = firestore.collection('games');
      const gamesQuery = gamesRef
        .where('startTime', '>=', todayTimestamp)
        .where('startTime', '<', tomorrowTimestamp);
      
      const gamesSnapshot = await trackDatabaseOperation(
        'query_games_for_prediction',
        () => gamesQuery.get()
      );
      
      if (gamesSnapshot.empty) {
        logger.info('No games scheduled for today');
        return null;
      }
      
      logger.info(`Found ${gamesSnapshot.size} games scheduled for today`);
      
      // Process each game
      const predictions = await Promise.all(
        gamesSnapshot.docs.map(async (gameDoc) => {
          const gameId = gameDoc.id;
          const gameData = gameDoc.data();
          
          logger.info(`Processing game ${gameId}: ${gameData.teamA} vs ${gameData.teamB}`);
          
          // Prepare game data for prediction
          const predictionInput = {
            gameId,
            teamA: gameData.teamA,
            teamB: gameData.teamB,
            sport: gameData.sport,
            league: gameData.league,
            startTime: gameData.startTime,
            // Add features for prediction
            momentumScore: gameData.momentumScore || 0,
            lineMovement: gameData.lineMovement || 0,
            publicBetPct: gameData.publicBetPct || 50,
            confidence: gameData.confidence || 0,
            isHomeTeam: gameData.isHomeTeam || false,
            streakIndicator: gameData.streakIndicator || 0
          };
          
          // Get prediction
          const prediction = await predictGameOutcome(predictionInput);
          
          if (prediction) {
            // Update game document with prediction
            await trackDatabaseOperation(
              'update_game_with_prediction',
              () => gameDoc.ref.update({
                aiPredictedWinner: prediction.predictedWinner,
                aiConfidence: prediction.adjustedConfidence,
                aiInsightText: prediction.aiInsightText,
                aiPredictionTimestamp: admin.firestore.FieldValue.serverTimestamp()
              })
            );
            
            logger.info(`Updated game ${gameId} with prediction: ${prediction.predictedWinner} (${prediction.adjustedConfidence}% confidence)`);
            
            return {
              gameId,
              teamA: gameData.teamA,
              teamB: gameData.teamB,
              prediction
            };
          } else {
            logger.error(`Failed to get prediction for game ${gameId}`);
            return null;
          }
        })
      );
      
      // Filter out null predictions
      const validPredictions = predictions.filter(p => p !== null);
      
      // Log prediction summary
      logger.info(`Successfully processed ${validPredictions.length} out of ${gamesSnapshot.size} games`);
      
      // Save prediction summary to Firestore
      await trackDatabaseOperation(
        'save_prediction_summary',
        () => firestore.collection('predictionLogs').add({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          totalGames: gamesSnapshot.size,
          processedGames: validPredictions.length,
          date: today.toISOString().split('T')[0]
        })
      );
      
      return validPredictions;
    } catch (error) {
      logger.error('Error in predictTodayGames function:', error);
      throw error;
    }
  }));

/**
 * Predicts the outcome of a game using the ML model
 * 
 * @param gameData Game data with features for prediction
 * @returns Prediction result or null if prediction fails
 */
async function predictGameOutcome(gameData: any): Promise<any> {
  try {
    // Use the Python script approach for predictions
    return await predictWithPythonScript(gameData);
  } catch (error) {
    logger.error(`Error predicting outcome for game ${gameData.gameId}:`, error);
    return null;
  }
}

/**
 * Predicts game outcome using the Python script directly
 * 
 * @param gameData Game data with features for prediction
 * @returns Prediction result or null if prediction fails
 */
async function predictWithPythonScript(gameData: any): Promise<any> {
  try {
    // Create a temporary file for the game data
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `game_${gameData.gameId}.json`);
    
    // Write game data to temporary file
    fs.writeFileSync(tempFilePath, JSON.stringify(gameData));
    
    // Get model path from environment or use default
    const modelUrl = process.env.FUNCTIONS_CONFIG_ML_MODEL_PATH || 'https://ai-sports-edge-com.web.app/models/model.pkl';
    
    logger.info(`Using ML model from: ${modelUrl}`);
    
    // Download the model to a temporary file
    const modelPath = path.join(tempDir, 'model.pkl');
    await trackApiCall(
      'download_ml_model',
      () => downloadFile(modelUrl, modelPath)
    );
    
    // Path to the Python script
    const scriptPath = path.join(__dirname, '../../ml/inference/predict_outcome.py');
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Python script not found at ${scriptPath}`);
    }
    
    // Run the Python script
    return new Promise((resolve, reject) => {
      // Command to run the Python script
      const pythonProcess = spawn('python3', [
        scriptPath,
        '--model', modelPath,
        '--input', tempFilePath
      ]);
      
      let output = '';
      let errorOutput = '';
      
      // Collect output
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      // Collect error output
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (error) {
          logger.warn(`Failed to delete temporary file ${tempFilePath}:`, error);
        }
        
        if (code === 0) {
          // Try to parse the JSON output
          try {
            // Find the JSON part of the output
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const prediction = JSON.parse(jsonMatch[0]);
              resolve(prediction);
            } else {
              reject(new Error(`Failed to parse prediction output: ${output}`));
            }
          } catch (error: any) {
            reject(new Error(`Failed to parse prediction output: ${error.message}`));
          }
        } else {
          reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  } catch (error) {
    logger.error('Error in predictWithPythonScript:', error);
    throw error;
  }
}

/**
 * Downloads a file from a URL to a local path
 *
 * @param url URL of the file to download
 * @param destPath Local path to save the file
 * @returns Promise that resolves when the download is complete
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.info(`Downloading file from ${url} to ${destPath}`);
    
    // Create write stream
    const file = fs.createWriteStream(destPath);
    
    // Determine protocol (http or https)
    const protocol = url.startsWith('https') ? https : http;
    
    // Make the request
    const request = protocol.get(url, (response) => {
      // Check if response is success
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      // Pipe response to file
      response.pipe(file);
      
      // Handle file completion
      file.on('finish', () => {
        file.close();
        logger.info(`Successfully downloaded file to ${destPath}`);
        resolve();
      });
    });
    
    // Handle request errors
    request.on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete the file if it exists
      reject(err);
    });
    
    // Handle file errors
    file.on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete the file if it exists
      reject(err);
    });
  });
}

// End of file