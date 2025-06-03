/**
 * Simple Sentry Monitored Functions - HTTP Only
 * Basic functions without Firestore dependencies for initial deployment verification
 */

const { onRequest } = require("firebase-functions/v2/https");
const { wrapHttpFunction, captureCloudFunctionError } = require("./sentryConfig");

/**
 * Basic Sentry verification function
 */
exports.sentryBasicTest = wrapHttpFunction(onRequest(async (req, res) => {
  console.log("Sentry basic test function called");
  
  try {
    const testType = req.query.test || "success";
    
    switch (testType) {
    case "error":
      throw new Error("Intentional test error for Sentry verification");
      
    case "warning":
      console.warn("Test warning captured by Sentry");
      break;
      
    case "info":
      console.info("Test info message for Sentry breadcrumbs");
      break;
    }
    
    res.json({
      success: true,
      message: "Sentry basic test completed successfully",
      testType,
      timestamp: new Date().toISOString(),
      function: "sentryBasicTest",
      sentry: {
        initialized: true,
        monitoring: "active",
        environment: process.env.NODE_ENV || "production"
      }
    });
    
  } catch (error) {
    console.error("Sentry basic test error:", error);
    captureCloudFunctionError(error, "sentryBasicTest", {
      query: req.query,
      timestamp: new Date().toISOString(),
      testContext: "basic-verification"
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      function: "sentryBasicTest"
    });
  }
}));

/**
 * Simple health check function
 */
exports.healthCheck = wrapHttpFunction(onRequest(async (req, res) => {
  console.log("Health check function called");
  
  try {
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "2.0.0",
      environment: process.env.NODE_ENV || "production",
      sentry: {
        active: true,
        dsn: "configured",
        errorCapture: "enabled"
      }
    };
    
    res.json(healthData);
    
  } catch (error) {
    console.error("Health check error:", error);
    captureCloudFunctionError(error, "healthCheck", {
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * Performance test function
 */
exports.performanceTest = wrapHttpFunction(onRequest(async (req, res) => {
  const startTime = Date.now();
  console.log("Performance test function started");
  
  try {
    // Simulate some processing time
    const iterations = parseInt(req.query.iterations) || 1000;
    let result = 0;
    
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i);
    }
    
    const processingTime = Date.now() - startTime;
    
    const performanceData = {
      success: true,
      iterations,
      result: Math.round(result),
      processingTime,
      timestamp: new Date().toISOString(),
      function: "performanceTest",
      performance: {
        executionTime: processingTime,
        iterationsPerMs: iterations / processingTime,
        memoryUsage: process.memoryUsage()
      }
    };
    
    res.json(performanceData);
    
  } catch (error) {
    console.error("Performance test error:", error);
    captureCloudFunctionError(error, "performanceTest", {
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

console.log("Simple Sentry functions loaded successfully");