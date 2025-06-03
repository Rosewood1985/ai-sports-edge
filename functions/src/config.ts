import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Loads Remote Config values and sets them as environment variables
 * for use in Firebase Functions
 */
export async function loadRemoteConfig(): Promise<void> {
  try {
    logger.info("Loading Remote Config values");
    
    // Get Remote Config template
    const remoteConfig = admin.remoteConfig();
    const template = await remoteConfig.getTemplate();
    
    // Extract parameters
    const parameters = template.parameters || {};
    
    // Set environment variables for each parameter
    // Helper function to safely extract parameter value
    const getParameterValue = (paramName: string, defaultVal: string): string => {
      if (parameters[paramName] && parameters[paramName].defaultValue) {
        // For Firebase Admin SDK v9+, the value is accessed differently
        const defaultValue = parameters[paramName].defaultValue as any;
        return defaultValue.value || defaultVal;
      }
      return defaultVal;
    };
    
    // Set environment variables for each parameter
    process.env.FUNCTIONS_CONFIG_ML_MODEL_PATH = getParameterValue(
      "ml_model_path",
      "https://ai-sports-edge-com.web.app/models/model.pkl"
    );
    logger.info(`Set ML model path: ${process.env.FUNCTIONS_CONFIG_ML_MODEL_PATH}`);
    
    process.env.FUNCTIONS_CONFIG_MIN_CONFIDENCE_THRESHOLD = getParameterValue(
      "min_confidence_threshold",
      "65"
    );
    logger.info(`Set min confidence threshold: ${process.env.FUNCTIONS_CONFIG_MIN_CONFIDENCE_THRESHOLD}`);
    
    process.env.FUNCTIONS_CONFIG_PREDICTION_SCHEDULE = getParameterValue(
      "prediction_schedule",
      "0 10 * * *"
    );
    logger.info(`Set prediction schedule: ${process.env.FUNCTIONS_CONFIG_PREDICTION_SCHEDULE}`);
    
    process.env.FUNCTIONS_CONFIG_PICK_OF_DAY_SCHEDULE = getParameterValue(
      "pick_of_day_schedule",
      "0 9 * * *"
    );
    logger.info(`Set pick of day schedule: ${process.env.FUNCTIONS_CONFIG_PICK_OF_DAY_SCHEDULE}`);
    
    process.env.FUNCTIONS_CONFIG_AI_PICK_OF_DAY_ENABLED = getParameterValue(
      "ai_pick_of_day_enabled",
      "true"
    );
    logger.info(`Set AI pick of day enabled: ${process.env.FUNCTIONS_CONFIG_AI_PICK_OF_DAY_ENABLED}`);
    
    logger.info("Remote Config values loaded successfully");
  } catch (error) {
    logger.error("Error loading Remote Config values:", error);
    // Set default values if Remote Config fails
    process.env.FUNCTIONS_CONFIG_ML_MODEL_PATH = "https://ai-sports-edge-com.web.app/models/model.pkl";
    process.env.FUNCTIONS_CONFIG_MIN_CONFIDENCE_THRESHOLD = "65";
    process.env.FUNCTIONS_CONFIG_PREDICTION_SCHEDULE = "0 10 * * *";
    process.env.FUNCTIONS_CONFIG_PICK_OF_DAY_SCHEDULE = "0 9 * * *";
    process.env.FUNCTIONS_CONFIG_AI_PICK_OF_DAY_ENABLED = "true";
    logger.info("Using default values for Remote Config");
  }
}