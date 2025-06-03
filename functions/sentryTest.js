const { onRequest } = require("firebase-functions/v2/https");
const { wrapHttpFunction, captureCloudFunctionError } = require("./sentryConfig");

/**
 * Simple test function to verify Sentry integration
 */
exports.sentryTest = wrapHttpFunction(onRequest(async (req, res) => {
  console.log("Sentry test function called successfully!");
  
  try {
    // Test Sentry error capture
    if (req.query.test === "error") {
      throw new Error("Test error for Sentry monitoring");
    }
    
    res.json({
      success: true,
      message: "Sentry integration working!",
      timestamp: new Date().toISOString(),
      sentry: "initialized"
    });
  } catch (error) {
    console.error("Test error captured:", error);
    captureCloudFunctionError(error, "sentryTest", {
      query: req.query
    });
    res.status(500).json({
      success: false,
      error: error.message,
      sentry: "error_captured"
    });
  }
}));