"use strict";
/**
 * Firebase Cloud Functions for Firestore Backups
 *
 * This file contains Cloud Functions for scheduling and managing Firestore backups.
 */
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
exports.getBackupSystemStatus = exports.manualFirestoreBackup = exports.scheduledFirestoreBackup = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
// Import the backup service
// Since this is a JavaScript module without type definitions, we need to use require
// and add a type declaration to avoid TypeScript errors
// eslint-disable-next-line @typescript-eslint/no-var-requires
const backupService = require("../../atomic/organisms/firebaseBackupService");
/**
 * Scheduled Cloud Function that runs daily at 3 AM UTC to backup Firestore
 */
exports.scheduledFirestoreBackup = (0, scheduler_1.onSchedule)("0 3 * * *", async () => {
    console.log("Starting scheduled Firestore backup...");
    try {
        const result = await backupService.executeBackup();
        if (result.success) {
            console.log(`Backup completed successfully. Path: ${result.path}`);
        }
        else {
            console.error(`Backup failed: ${result.error.message}`);
        }
    }
    catch (error) {
        console.error("Unexpected error in backup function:", error);
    }
});
/**
 * HTTP Function to manually trigger a Firestore backup
 */
exports.manualFirestoreBackup = (0, https_1.onCall)(async (request) => {
    // Check if the user is authenticated and has admin privileges
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be authenticated to trigger a backup.");
    }
    // In a real implementation, you would check if the user has admin privileges
    // For now, we'll just check if they're authenticated
    console.log(`Manual backup triggered by user: ${request.auth.uid}`);
    try {
        const result = await backupService.executeBackup();
        if (result.success) {
            console.log(`Manual backup completed successfully. Path: ${result.path}`);
            return {
                success: true,
                path: result.path,
            };
        }
        else {
            console.error(`Manual backup failed: ${result.error.message}`);
            return {
                success: false,
                error: result.error,
            };
        }
    }
    catch (error) {
        console.error("Unexpected error in manual backup function:", error);
        throw new https_1.HttpsError("internal", "An unexpected error occurred during the backup.", { message: error instanceof Error ? error.message : String(error) });
    }
});
/**
 * HTTP Function to get the status of the backup system
 */
exports.getBackupSystemStatus = (0, https_1.onCall)(async (request) => {
    // Check if the user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be authenticated to get backup status.");
    }
    try {
        const status = await backupService.getBackupStatus();
        return status;
    }
    catch (error) {
        console.error("Error getting backup status:", error);
        throw new https_1.HttpsError("internal", "An error occurred while getting backup status.", { message: error instanceof Error ? error.message : String(error) });
    }
});
//# sourceMappingURL=backups.js.map