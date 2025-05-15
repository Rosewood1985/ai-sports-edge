#!/usr/bin/env node

const { exec } = require("child_process");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const BUILD_DIR = "dist";
const LOCAL_SERVER_URL = "http://localhost:8081"; // Default for `npx serve dist` often uses 8081 or 3000, adjust if needed
const KEY_ROUTES_TO_CHECK = ["/", "/index.html"]; // Add other critical routes like '/login', '/profile' etc.
const ROUTING_FILE_PATH = "App.tsx"; // Adjust if your main router is elsewhere (e.g., 'navigation/index.tsx')
// Depcheck configuration (adjust ignores as needed)
const DEPCHECK_OPTIONS = {
  ignoreBinPackage: false,
  skipMissing: false,
  ignorePatterns: [
    "dist",
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "jest.config.js",
    "webpack.config.js",
    "*.test.ts",
    "*.spec.ts",
    "*.test.tsx",
    "*.spec.tsx",
    "scripts/*",
    "__mocks__/*",
    "__tests__/*",
    "coverage/*",
    ".expo/*",
    ".expo-shared/*",
  ],
  ignoreMatches: [
    // Add specific packages to ignore if depcheck incorrectly flags them
    // e.g., 'react-native-vector-icons'
  ],
};

// --- Helper Functions ---
const log = (message) => console.log(`[Build Check] ${message}`);
const logSuccess = (message) => console.log(`✅ [Build Check] ${message}`);
const logWarning = (message) => console.warn(`⚠️ [Build Check] ${message}`);
const logError = (message) => console.error(`❌ [Build Check] ${message}`);
const logInfo = (message) => console.info(`ℹ️ [Build Check] ${message}`);

// --- Check Functions ---

// 1. Unused Dependencies Check (using depcheck)
async function checkUnusedDependencies() {
  log("Running Unused Dependencies Check...");
  return new Promise((resolve) => {
    // Construct the depcheck command string from options
    const ignoreDirs = DEPCHECK_OPTIONS.ignorePatterns
      .map((p) => `--ignores="${p}"`)
      .join(" ");
    const ignoreMatches = DEPCHECK_OPTIONS.ignoreMatches
      .map((p) => `--ignore-matches="${p}"`)
      .join(" ");
    const command = `npx depcheck . ${ignoreDirs} ${ignoreMatches} --json`;

    exec(command, { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      // Increased buffer size
      if (stderr && !stderr.includes("DeprecationWarning")) {
        // Ignore Node deprecation warnings
        // Sometimes depcheck errors but still outputs JSON, try parsing anyway
        try {
          const result = JSON.parse(stdout);
          handleDepcheckResult(result);
        } catch (parseError) {
          logError(`Depcheck execution failed: ${stderr}`);
          logWarning("Could not complete Unused Dependencies Check.");
          resolve(false); // Indicate check failed or couldn't run
          return;
        }
      } else if (error) {
        // Handle cases where depcheck exits with an error code but might have output
        try {
          const result = JSON.parse(stdout);
          handleDepcheckResult(result);
        } catch (parseError) {
          logError(
            `Depcheck execution error (Code: ${error.code}): ${error.message}`
          );
          logWarning("Could not complete Unused Dependencies Check.");
          resolve(false);
          return;
        }
      } else {
        try {
          const result = JSON.parse(stdout);
          handleDepcheckResult(result);
        } catch (parseError) {
          logError(`Failed to parse depcheck output: ${parseError}`);
          logWarning(`Raw output: ${stdout}`);
          resolve(false);
          return;
        }
      }
      resolve(true); // Indicate check completed (even if issues were found)
    });
  });
}

function handleDepcheckResult(result) {
  const unusedDeps = Object.keys(result.dependencies);
  const unusedDevDeps = Object.keys(result.devDependencies);
  const missingDeps = Object.keys(result.missing).length > 0; // Checks if 'missing' has any keys

  if (unusedDeps.length === 0 && unusedDevDeps.length === 0 && !missingDeps) {
    logSuccess(
      "Unused Dependencies Check: Passed. No unused dependencies found."
    );
  } else {
    if (unusedDeps.length > 0) {
      logWarning(
        `Found ${
          unusedDeps.length
        } potentially unused dependencies: ${unusedDeps.join(", ")}`
      );
    }
    if (unusedDevDeps.length > 0) {
      logWarning(
        `Found ${
          unusedDevDeps.length
        } potentially unused devDependencies: ${unusedDevDeps.join(", ")}`
      );
    }
    if (missingDeps) {
      logError(
        "Missing dependencies detected by depcheck. Check depcheck output above."
      );
      // Log details if available (depcheck structure might vary)
      if (result.missing && typeof result.missing === "object") {
        Object.entries(result.missing).forEach(([dep, files]) => {
          logError(`  - ${dep} is used in: ${files.join(", ")}`);
        });
      }
    }
    logWarning(
      "Unused Dependencies Check: Issues found (see warnings/errors above)."
    );
  }
  // Log invalid files/dirs if any
  if (result.invalidFiles && Object.keys(result.invalidFiles).length > 0) {
    logWarning(
      `Depcheck encountered invalid files: ${Object.keys(
        result.invalidFiles
      ).join(", ")}`
    );
  }
  if (result.invalidDirs && Object.keys(result.invalidDirs).length > 0) {
    logWarning(
      `Depcheck encountered invalid directories: ${Object.keys(
        result.invalidDirs
      ).join(", ")}`
    );
  }
}

// 2. Route Definition Check (Basic Static Analysis)
async function checkRouteDefinitions() {
  log("Running Route Definition Check...");
  logInfo(`Analyzing routing file: ${ROUTING_FILE_PATH}`);
  // Basic check: Does the routing file exist?
  if (!fs.existsSync(ROUTING_FILE_PATH)) {
    logError(
      `Routing file not found at ${ROUTING_FILE_PATH}. Cannot perform check.`
    );
    return;
  }

  // VERY basic analysis: Look for common patterns like '<Stack.Screen name="..."' or 'Route path="..."'
  // This is a placeholder and likely needs significant improvement based on the actual routing library/setup.
  try {
    const content = fs.readFileSync(ROUTING_FILE_PATH, "utf-8");
    const routePatterns = [
      /<(?:Stack|Tab)\.Screen\s+name=["']([^"']+)["']/g, // React Navigation (Stack, Tab)
      /path=["']([^"']+)["']/g, // Common pattern for web routers like React Router
      // Add more regex patterns based on the specific routing library used
    ];

    let definedRoutes = new Set();
    routePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        definedRoutes.add(match[1]);
      }
    });

    if (definedRoutes.size > 0) {
      logSuccess(
        `Route Definition Check: Found ${
          definedRoutes.size
        } potential route definitions: [${Array.from(definedRoutes).join(
          ", "
        )}]`
      );
      logInfo(
        "Note: This is a basic static analysis. It may not find all routes (especially dynamic ones) and does not verify component existence."
      );
    } else {
      logWarning(
        "Route Definition Check: Could not automatically detect route definitions. Manual verification recommended."
      );
    }
  } catch (error) {
    logError(
      `Error reading or analyzing routing file ${ROUTING_FILE_PATH}: ${error.message}`
    );
  }
}

// 3. Runtime Checks (Requires Local Server)
async function checkRuntime() {
  log("Running Runtime Checks...");
  logInfo(`Attempting to connect to local server at ${LOCAL_SERVER_URL}`);
  logWarning(
    "IMPORTANT: Ensure a local server is running the build output from the `dist/` directory."
  );
  logWarning(
    "Example: Run `npx serve dist` in a separate terminal before this script."
  );

  let allOk = true;

  for (const route of KEY_ROUTES_TO_CHECK) {
    const url = `${LOCAL_SERVER_URL}${
      route.startsWith("/") ? "" : "/"
    }${route}`;
    log(`Checking URL: ${url}`);
    try {
      const response = await fetch(url, { timeout: 5000 }); // 5 second timeout
      if (response.ok) {
        // Status code 200-299
        logSuccess(`  - ${route}: Status ${response.status} OK`);
      } else {
        logError(
          `  - ${route}: Status ${response.status} ${response.statusText}`
        );
        allOk = false;
      }
    } catch (error) {
      logError(`  - ${route}: Failed to fetch - ${error.message}`);
      logError(
        `  Is the server running at ${LOCAL_SERVER_URL} and serving the '${BUILD_DIR}' directory?`
      );
      allOk = false;
      // Optional: break early if server seems down
      // break;
    }
  }

  if (allOk) {
    logSuccess("Runtime Checks: All checked routes returned OK status.");
  } else {
    logError("Runtime Checks: One or more routes failed. See errors above.");
  }
}

// --- Main Execution ---
async function runChecks() {
  log("Starting build checks...");

  // Check if build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    logError(
      `Build directory '${BUILD_DIR}' not found. Run the build process first.`
    );
    process.exit(1);
  }

  await checkUnusedDependencies();
  console.log("\n---\n"); // Separator
  await checkRouteDefinitions();
  console.log("\n---\n"); // Separator
  await checkRuntime();

  log("Build checks finished.");
  // Optionally, exit with an error code if any checks failed critically
  // process.exit(some_error_condition ? 1 : 0);
}

runChecks();
