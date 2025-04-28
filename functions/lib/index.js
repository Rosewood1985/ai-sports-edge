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
exports.updateStatsPage = exports.markAIPickOfDay = exports.predictTodayGames = void 0;
const functions = __importStar(require("firebase-functions"));
const config_1 = require("./config");
// Log when the functions are initialized
functions.logger.info('Firebase Functions initializing');
// Load Remote Config values before exporting functions
(async () => {
    try {
        // Load Remote Config values
        await (0, config_1.loadRemoteConfig)();
        // Now export the functions
        functions.logger.info('Remote Config loaded, exporting functions');
    }
    catch (error) {
        functions.logger.error('Error loading Remote Config:', error);
        functions.logger.info('Continuing with default values');
    }
})();
// Export all functions
var predictTodayGames_1 = require("./predictTodayGames");
Object.defineProperty(exports, "predictTodayGames", { enumerable: true, get: function () { return predictTodayGames_1.predictTodayGames; } });
var markAIPickOfDay_1 = require("./markAIPickOfDay");
Object.defineProperty(exports, "markAIPickOfDay", { enumerable: true, get: function () { return markAIPickOfDay_1.markAIPickOfDay; } });
var updateStatsPage_1 = require("./updateStatsPage");
Object.defineProperty(exports, "updateStatsPage", { enumerable: true, get: function () { return updateStatsPage_1.updateStatsPage; } });
functions.logger.info('Firebase Functions initialized');
//# sourceMappingURL=index.js.map