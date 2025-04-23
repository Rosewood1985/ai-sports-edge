"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRemoteConfig = void 0;
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Loads Remote Config values and sets them as environment variables
 * for use in Firebase Functions
 */
async function loadRemoteConfig() {
    try {
        firebase_functions_1.logger.info('Loading Remote Config values');
        // Get Remote Config template
        const remoteConfig = admin.remoteConfig();
        const template = await remoteConfig.getTemplate();
        // Extract parameters
        const parameters = template.parameters || {};
        // Set environment variables for each parameter
        // Helper function to safely extract parameter value
        const getParameterValue = (paramName, defaultVal) => {
            if (parameters[paramName] && parameters[paramName].defaultValue) {
                // For Firebase Admin SDK v9+, the value is accessed differently
                const defaultValue = parameters[paramName].defaultValue;
                return defaultValue.value || defaultVal;
            }
            return defaultVal;
        };
        // Set environment variables for each parameter
        process.env.FUNCTIONS_CONFIG_ML_MODEL_PATH = getParameterValue('ml_model_path', 'https://ai-sports-edge-com.web.app/models/model.pkl');
        firebase_functions_1.logger.info(`Set ML model path: ${process.env.FUNCTIONS_CONFIG_ML_MODEL_PATH}`);
        process.env.FUNCTIONS_CONFIG_MIN_CONFIDENCE_THRESHOLD = getParameterValue('min_confidence_threshold', '65');
        firebase_functions_1.logger.info(`Set min confidence threshold: ${process.env.FUNCTIONS_CONFIG_MIN_CONFIDENCE_THRESHOLD}`);
        process.env.FUNCTIONS_CONFIG_PREDICTION_SCHEDULE = getParameterValue('prediction_schedule', '0 10 * * *');
        firebase_functions_1.logger.info(`Set prediction schedule: ${process.env.FUNCTIONS_CONFIG_PREDICTION_SCHEDULE}`);
        process.env.FUNCTIONS_CONFIG_PICK_OF_DAY_SCHEDULE = getParameterValue('pick_of_day_schedule', '0 9 * * *');
        firebase_functions_1.logger.info(`Set pick of day schedule: ${process.env.FUNCTIONS_CONFIG_PICK_OF_DAY_SCHEDULE}`);
        process.env.FUNCTIONS_CONFIG_AI_PICK_OF_DAY_ENABLED = getParameterValue('ai_pick_of_day_enabled', 'true');
        firebase_functions_1.logger.info(`Set AI pick of day enabled: ${process.env.FUNCTIONS_CONFIG_AI_PICK_OF_DAY_ENABLED}`);
        firebase_functions_1.logger.info('Remote Config values loaded successfully');
    }
    catch (error) {
        firebase_functions_1.logger.error('Error loading Remote Config values:', error);
        // Set default values if Remote Config fails
        process.env.FUNCTIONS_CONFIG_ML_MODEL_PATH = 'https://ai-sports-edge-com.web.app/models/model.pkl';
        process.env.FUNCTIONS_CONFIG_MIN_CONFIDENCE_THRESHOLD = '65';
        process.env.FUNCTIONS_CONFIG_PREDICTION_SCHEDULE = '0 10 * * *';
        process.env.FUNCTIONS_CONFIG_PICK_OF_DAY_SCHEDULE = '0 9 * * *';
        process.env.FUNCTIONS_CONFIG_AI_PICK_OF_DAY_ENABLED = 'true';
        firebase_functions_1.logger.info('Using default values for Remote Config');
    }
}
exports.loadRemoteConfig = loadRemoteConfig;
//# sourceMappingURL=config.js.map