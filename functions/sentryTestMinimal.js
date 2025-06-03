const { onRequest } = require("firebase-functions/v2/https");

/**
 * Minimal test function without dependencies for deployment verification
 */
exports.sentryTestMinimal = onRequest(async (req, res) => {
  console.log("Minimal test function called successfully!");
  
  try {
    // Test different scenarios based on query parameter
    if (req.query.test === "error") {
      throw new Error("Test error for monitoring");
    }
    
    if (req.query.test === "warning") {
      console.warn("Test warning for monitoring");
    }
    
    // Success response
    res.json({
      success: true,
      message: "Basic function deployed successfully!",
      timestamp: new Date().toISOString(),
      status: "deployed",
      environment: "firebase-functions"
    });
    
  } catch (error) {
    console.error("Test error:", error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});