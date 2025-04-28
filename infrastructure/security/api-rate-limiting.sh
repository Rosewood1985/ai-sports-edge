#!/bin/bash

# API Rate Limiting Script
# This script implements production-grade rate limiting for AI Sports Edge API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - API Rate Limiting${NC}"
echo "=================================================="

# Configuration variables
APP_NAME="ai-sports-edge"
CONFIG_DIR="config/security"
RATE_LIMIT_CONFIG="${CONFIG_DIR}/rate-limit-config.json"
NGINX_CONF_DIR="infrastructure/nginx"
NGINX_RATE_LIMIT_CONF="${NGINX_CONF_DIR}/rate-limiting.conf"
API_GATEWAY_DIR="infrastructure/api-gateway"
API_GATEWAY_CONF="${API_GATEWAY_DIR}/api-gateway.json"
REDIS_CONF_DIR="infrastructure/redis"
REDIS_CONF="${REDIS_CONF_DIR}/redis.conf"

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it first.${NC}"
        return 1
    fi
    return 0
}

# Check for required tools
check_command "jq" || exit 1
check_command "aws" || exit 1

# Function to display section header
section_header() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "=================================================="
}

# Function to create directories
create_directories() {
    mkdir -p "${CONFIG_DIR}"
    mkdir -p "${NGINX_CONF_DIR}"
    mkdir -p "${API_GATEWAY_DIR}"
    mkdir -p "${REDIS_CONF_DIR}"
    echo "Created directories: ${CONFIG_DIR}, ${NGINX_CONF_DIR}, ${API_GATEWAY_DIR}, ${REDIS_CONF_DIR}"
}

# Function to create or update rate limit configuration
create_rate_limit_config() {
    if [ ! -f "${RATE_LIMIT_CONFIG}" ]; then
        # Create initial rate limit configuration file
        cat > "${RATE_LIMIT_CONFIG}" << EOF
{
  "global_limits": {
    "requests_per_second": 100,
    "requests_per_minute": 1000,
    "requests_per_hour": 10000,
    "requests_per_day": 100000
  },
  "endpoint_limits": {
    "/api/v1/predictions": {
      "requests_per_second": 10,
      "requests_per_minute": 100,
      "burst": 20
    },
    "/api/v1/users": {
      "requests_per_second": 5,
      "requests_per_minute": 50,
      "burst": 10
    },
    "/api/v1/auth": {
      "requests_per_second": 2,
      "requests_per_minute": 20,
      "burst": 5
    }
  },
  "user_tier_limits": {
    "free": {
      "requests_per_day": 1000,
      "requests_per_hour": 100,
      "concurrent_requests": 5
    },
    "basic": {
      "requests_per_day": 10000,
      "requests_per_hour": 1000,
      "concurrent_requests": 10
    },
    "premium": {
      "requests_per_day": 100000,
      "requests_per_hour": 10000,
      "concurrent_requests": 20
    },
    "enterprise": {
      "requests_per_day": 1000000,
      "requests_per_hour": 100000,
      "concurrent_requests": 50
    }
  },
  "ip_whitelist": [
    "127.0.0.1",
    "10.0.0.0/8"
  ],
  "rate_limit_headers": true,
  "rate_limit_response": {
    "status_code": 429,
    "content_type": "application/json",
    "body": "{\"error\":\"Too many requests\",\"retry_after\":\"$retry_after\"}"
  },
  "storage": {
    "type": "redis",
    "redis": {
      "host": "localhost",
      "port": 6379,
      "database": 0,
      "key_prefix": "ratelimit:"
    }
  },
  "monitoring": {
    "enabled": true,
    "log_exceeded_limits": true,
    "alert_on_exceeded_limits": true
  }
}
EOF
        echo -e "${GREEN}Created initial rate limit configuration file: ${RATE_LIMIT_CONFIG}${NC}"
    else
        echo "Rate limit configuration file already exists: ${RATE_LIMIT_CONFIG}"
    fi
}

# Function to configure Nginx rate limiting
configure_nginx_rate_limiting() {
    section_header "Configuring Nginx Rate Limiting"
    
    if [ ! -f "${RATE_LIMIT_CONFIG}" ]; then
        echo -e "${RED}Error: Rate limit configuration file not found: ${RATE_LIMIT_CONFIG}${NC}"
        return 1
    fi
    
    echo "Configuring Nginx rate limiting..."
    
    # Get global limits from config
    local req_per_second=$(jq -r '.global_limits.requests_per_second' "${RATE_LIMIT_CONFIG}")
    local req_per_minute=$(jq -r '.global_limits.requests_per_minute' "${RATE_LIMIT_CONFIG}")
    
    # Get endpoint limits from config
    local endpoints=$(jq -r '.endpoint_limits | keys[]' "${RATE_LIMIT_CONFIG}")
    
    # Create Nginx rate limiting configuration
    cat > "${NGINX_RATE_LIMIT_CONF}" << EOF
# Rate limiting configuration for AI Sports Edge API
# Generated on $(date)

# Define limit zones
limit_req_zone \$binary_remote_addr zone=global:10m rate=${req_per_second}r/s;
EOF

    # Add endpoint-specific limit zones
    for endpoint in $endpoints; do
        local endpoint_req_per_second=$(jq -r ".endpoint_limits[\"$endpoint\"].requests_per_second" "${RATE_LIMIT_CONFIG}")
        local endpoint_name=$(echo "$endpoint" | sed 's/[\/]/_/g' | sed 's/^_//')
        
        echo "limit_req_zone \$binary_remote_addr zone=${endpoint_name}:5m rate=${endpoint_req_per_second}r/s;" >> "${NGINX_RATE_LIMIT_CONF}"
    done

    # Add rate limiting to server configuration
    cat >> "${NGINX_RATE_LIMIT_CONF}" << EOF

# Apply global rate limiting
limit_req zone=global burst=20 nodelay;

# Enable rate limit headers
add_header X-RateLimit-Limit \$limit_req_limit always;
add_header X-RateLimit-Remaining \$limit_req_remaining always;
add_header X-RateLimit-Reset \$limit_req_reset always;

# Custom error page for rate limiting
error_page 429 /rate_limit_exceeded.json;
location = /rate_limit_exceeded.json {
    internal;
    default_type application/json;
    return 429 '{"error":"Too many requests","retry_after":"\$limit_req_reset"}';
}

# Endpoint-specific rate limiting
EOF

    # Add endpoint-specific rate limiting
    for endpoint in $endpoints; do
        local endpoint_burst=$(jq -r ".endpoint_limits[\"$endpoint\"].burst" "${RATE_LIMIT_CONFIG}")
        local endpoint_name=$(echo "$endpoint" | sed 's/[\/]/_/g' | sed 's/^_//')
        
        echo "location $endpoint {" >> "${NGINX_RATE_LIMIT_CONF}"
        echo "    limit_req zone=${endpoint_name} burst=${endpoint_burst} nodelay;" >> "${NGINX_RATE_LIMIT_CONF}"
        echo "    proxy_pass http://backend;" >> "${NGINX_RATE_LIMIT_CONF}"
        echo "}" >> "${NGINX_RATE_LIMIT_CONF}"
    done
    
    echo -e "${GREEN}Nginx rate limiting configuration created: ${NGINX_RATE_LIMIT_CONF}${NC}"
    echo "To apply this configuration, include it in your main Nginx configuration file:"
    echo "include ${NGINX_RATE_LIMIT_CONF};"
}

# Function to configure AWS API Gateway rate limiting
configure_api_gateway_rate_limiting() {
    section_header "Configuring AWS API Gateway Rate Limiting"
    
    if [ ! -f "${RATE_LIMIT_CONFIG}" ]; then
        echo -e "${RED}Error: Rate limit configuration file not found: ${RATE_LIMIT_CONFIG}${NC}"
        return 1
    fi
    
    echo "Configuring AWS API Gateway rate limiting..."
    
    # Get global limits from config
    local req_per_second=$(jq -r '.global_limits.requests_per_second' "${RATE_LIMIT_CONFIG}")
    
    # Get user tier limits from config
    local user_tiers=$(jq -r '.user_tier_limits | keys[]' "${RATE_LIMIT_CONFIG}")
    
    # Create API Gateway usage plans configuration
    cat > "${API_GATEWAY_CONF}" << EOF
{
  "swagger": "2.0",
  "info": {
    "title": "${APP_NAME}-api",
    "version": "1.0.0"
  },
  "basePath": "/v1",
  "schemes": ["https"],
  "paths": {},
  "securityDefinitions": {
    "api_key": {
      "type": "apiKey",
      "name": "x-api-key",
      "in": "header"
    }
  },
  "x-amazon-apigateway-gateway-responses": {
    "DEFAULT_4XX": {
      "responseTemplates": {
        "application/json": "{\"error\":\"Client error\",\"message\":\"\$context.error.message\"}"
      }
    },
    "DEFAULT_5XX": {
      "responseTemplates": {
        "application/json": "{\"error\":\"Server error\",\"message\":\"\$context.error.message\"}"
      }
    },
    "THROTTLED": {
      "statusCode": 429,
      "responseTemplates": {
        "application/json": "{\"error\":\"Too many requests\",\"retry_after\":\"\$context.rateLimit.retryAfter\"}"
      },
      "responseParameters": {
        "gatewayresponse.header.x-ratelimit-limit": "'\$context.rateLimit.limit'",
        "gatewayresponse.header.x-ratelimit-remaining": "'\$context.rateLimit.remaining'",
        "gatewayresponse.header.x-ratelimit-reset": "'\$context.rateLimit.reset'"
      }
    }
  },
  "x-amazon-apigateway-request-validators": {
    "validate-all": {
      "validateRequestBody": true,
      "validateRequestParameters": true
    }
  },
  "x-amazon-apigateway-request-validator": "validate-all",
  "x-amazon-apigateway-api-key-source": "HEADER",
  "x-amazon-apigateway-usage-plan-keys": {
EOF

    # Add usage plan keys for each user tier
    local first=true
    for tier in $user_tiers; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "${API_GATEWAY_CONF}"
        fi
        
        echo "    \"${tier}\": {" >> "${API_GATEWAY_CONF}"
        echo "      \"type\": \"API_KEY\"," >> "${API_GATEWAY_CONF}"
        echo "      \"name\": \"${tier}-key\"," >> "${API_GATEWAY_CONF}"
        echo "      \"value\": \"\$\{stageVariables.${tier}ApiKey\}\"" >> "${API_GATEWAY_CONF}"
        echo "    }" >> "${API_GATEWAY_CONF}"
    done

    # Add usage plans for each user tier
    cat >> "${API_GATEWAY_CONF}" << EOF
  },
  "x-amazon-apigateway-usage-plans": {
EOF

    first=true
    for tier in $user_tiers; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "${API_GATEWAY_CONF}"
        fi
        
        local req_per_day=$(jq -r ".user_tier_limits[\"$tier\"].requests_per_day" "${RATE_LIMIT_CONFIG}")
        local req_per_hour=$(jq -r ".user_tier_limits[\"$tier\"].requests_per_hour" "${RATE_LIMIT_CONFIG}")
        local burst=$(jq -r ".user_tier_limits[\"$tier\"].concurrent_requests" "${RATE_LIMIT_CONFIG}")
        
        echo "    \"${tier}\": {" >> "${API_GATEWAY_CONF}"
        echo "      \"description\": \"${tier} tier usage plan\"," >> "${API_GATEWAY_CONF}"
        echo "      \"quota\": {" >> "${API_GATEWAY_CONF}"
        echo "        \"limit\": ${req_per_day}," >> "${API_GATEWAY_CONF}"
        echo "        \"period\": \"DAY\"," >> "${API_GATEWAY_CONF}"
        echo "        \"offset\": 0" >> "${API_GATEWAY_CONF}"
        echo "      }," >> "${API_GATEWAY_CONF}"
        echo "      \"throttle\": {" >> "${API_GATEWAY_CONF}"
        echo "        \"rateLimit\": $(($req_per_hour / 3600))," >> "${API_GATEWAY_CONF}"
        echo "        \"burstLimit\": ${burst}" >> "${API_GATEWAY_CONF}"
        echo "      }," >> "${API_GATEWAY_CONF}"
        echo "      \"apiStages\": [" >> "${API_GATEWAY_CONF}"
        echo "        {" >> "${API_GATEWAY_CONF}"
        echo "          \"apiId\": \"\$\{stageVariables.apiId\}\"," >> "${API_GATEWAY_CONF}"
        echo "          \"stage\": \"\$\{stageVariables.stageName\}\"" >> "${API_GATEWAY_CONF}"
        echo "        }" >> "${API_GATEWAY_CONF}"
        echo "      ]" >> "${API_GATEWAY_CONF}"
        echo "    }" >> "${API_GATEWAY_CONF}"
    done

    # Close the configuration
    cat >> "${API_GATEWAY_CONF}" << EOF
  }
}
EOF
    
    echo -e "${GREEN}AWS API Gateway rate limiting configuration created: ${API_GATEWAY_CONF}${NC}"
    echo "To apply this configuration, use the AWS CLI or AWS CloudFormation."
}

# Function to configure Redis for rate limiting
configure_redis_rate_limiting() {
    section_header "Configuring Redis for Rate Limiting"
    
    if [ ! -f "${RATE_LIMIT_CONFIG}" ]; then
        echo -e "${RED}Error: Rate limit configuration file not found: ${RATE_LIMIT_CONFIG}${NC}"
        return 1
    fi
    
    echo "Configuring Redis for rate limiting..."
    
    # Get Redis configuration from config
    local redis_host=$(jq -r '.storage.redis.host' "${RATE_LIMIT_CONFIG}")
    local redis_port=$(jq -r '.storage.redis.port' "${RATE_LIMIT_CONFIG}")
    local redis_db=$(jq -r '.storage.redis.database' "${RATE_LIMIT_CONFIG}")
    
    # Create Redis configuration
    cat > "${REDIS_CONF}" << EOF
# Redis configuration for AI Sports Edge rate limiting
# Generated on $(date)

# Basic configuration
bind ${redis_host}
port ${redis_port}
daemonize yes
pidfile /var/run/redis/redis-server.pid
logfile /var/log/redis/redis-server.log

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
dbfilename dump.rdb
dir /var/lib/redis

# Security
requirepass REPLACE_WITH_STRONG_PASSWORD

# Performance tuning
tcp-backlog 511
timeout 0
tcp-keepalive 300
databases 16
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
slave-serve-stale-data yes
slave-read-only yes
repl-diskless-sync no
repl-diskless-sync-delay 5
repl-disable-tcp-nodelay no
slave-priority 100
appendonly no
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
latency-monitor-threshold 0
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit slave 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
aof-rewrite-incremental-fsync yes
EOF
    
    echo -e "${GREEN}Redis configuration created: ${REDIS_CONF}${NC}"
    echo "To apply this configuration, copy it to your Redis server and restart Redis."
    echo "Remember to replace the default password with a strong password."
}

# Function to configure Express.js rate limiting
configure_express_rate_limiting() {
    section_header "Configuring Express.js Rate Limiting"
    
    if [ ! -f "${RATE_LIMIT_CONFIG}" ]; then
        echo -e "${RED}Error: Rate limit configuration file not found: ${RATE_LIMIT_CONFIG}${NC}"
        return 1
    fi
    
    echo "Configuring Express.js rate limiting..."
    
    # Create Express.js rate limiting middleware
    local middleware_dir="api/middleware"
    mkdir -p "${middleware_dir}"
    
    cat > "${middleware_dir}/rateLimiter.js" << EOF
/**
 * Rate Limiting Middleware for Express.js
 * 
 * This middleware implements production-grade rate limiting for the AI Sports Edge API.
 * It uses Redis for distributed rate limiting and supports different limits for different
 * user tiers and endpoints.
 */

const redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const config = require('../../config/security/rate-limit-config.json');

// Create Redis client
const redisClient = redis.createClient({
  host: config.storage.redis.host,
  port: config.storage.redis.port,
  database: config.storage.redis.database,
  enable_offline_queue: false,
  password: process.env.REDIS_PASSWORD || 'REPLACE_WITH_STRONG_PASSWORD'
});

// Global rate limiter
const globalRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: \`\${config.storage.redis.key_prefix}global:\`,
  points: config.global_limits.requests_per_second,
  duration: 1, // per second
  blockDuration: 60, // Block for 1 minute if limit is exceeded
});

// Endpoint-specific rate limiters
const endpointLimiters = {};
Object.entries(config.endpoint_limits).forEach(([endpoint, limits]) => {
  endpointLimiters[endpoint] = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: \`\${config.storage.redis.key_prefix}endpoint:\${endpoint}:\`,
    points: limits.requests_per_second,
    duration: 1, // per second
    blockDuration: 30, // Block for 30 seconds if limit is exceeded
  });
});

// User tier rate limiters
const userTierLimiters = {};
Object.entries(config.user_tier_limits).forEach(([tier, limits]) => {
  userTierLimiters[tier] = {
    hourly: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: \`\${config.storage.redis.key_prefix}tier:\${tier}:hourly:\`,
      points: limits.requests_per_hour,
      duration: 60 * 60, // per hour
      blockDuration: 60 * 10, // Block for 10 minutes if limit is exceeded
    }),
    daily: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: \`\${config.storage.redis.key_prefix}tier:\${tier}:daily:\`,
      points: limits.requests_per_day,
      duration: 60 * 60 * 24, // per day
      blockDuration: 60 * 60, // Block for 1 hour if limit is exceeded
    }),
  };
});

/**
 * Get user tier from request
 * @param {Object} req - Express request object
 * @returns {string} User tier
 */
const getUserTier = (req) => {
  // In a real application, you would get the user tier from authentication
  // For example, from a JWT token or user database
  // This is a simplified example
  if (req.user && req.user.tier) {
    return req.user.tier;
  }
  
  // Default to free tier
  return 'free';
};

/**
 * Rate limiting middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const rateLimiter = async (req, res, next) => {
  try {
    // Get client identifier (IP address or user ID)
    const clientId = req.user ? req.user.id : req.ip;
    
    // Get user tier
    const userTier = getUserTier(req);
    
    // Get endpoint
    const endpoint = req.path;
    
    // Apply global rate limiting
    try {
      await globalRateLimiter.consume(clientId);
    } catch (error) {
      if (config.monitoring.log_exceeded_limits) {
        console.warn(\`Global rate limit exceeded for \${clientId}\`);
      }
      
      return sendRateLimitResponse(res, error);
    }
    
    // Apply endpoint-specific rate limiting if applicable
    const endpointLimiter = Object.keys(endpointLimiters).find(pattern => 
      endpoint.startsWith(pattern) || new RegExp(pattern).test(endpoint)
    );
    
    if (endpointLimiter) {
      try {
        await endpointLimiters[endpointLimiter].consume(clientId);
      } catch (error) {
        if (config.monitoring.log_exceeded_limits) {
          console.warn(\`Endpoint rate limit exceeded for \${clientId} on \${endpoint}\`);
        }
        
        return sendRateLimitResponse(res, error);
      }
    }
    
    // Apply user tier rate limiting
    if (userTierLimiters[userTier]) {
      try {
        // Check hourly limit
        await userTierLimiters[userTier].hourly.consume(clientId);
        
        // Check daily limit
        await userTierLimiters[userTier].daily.consume(clientId);
      } catch (error) {
        if (config.monitoring.log_exceeded_limits) {
          console.warn(\`User tier rate limit exceeded for \${clientId} (tier: \${userTier})\`);
        }
        
        return sendRateLimitResponse(res, error);
      }
    }
    
    // All rate limits passed, proceed to next middleware
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next(error);
  }
};

/**
 * Send rate limit response
 * @param {Object} res - Express response object
 * @param {Object} error - Rate limiter error
 */
const sendRateLimitResponse = (res, error) => {
  // Add rate limit headers if enabled
  if (config.rate_limit_headers) {
    res.set('X-RateLimit-Limit', error.limit);
    res.set('X-RateLimit-Remaining', 0);
    res.set('X-RateLimit-Reset', new Date(Date.now() + error.msBeforeNext).toISOString());
    res.set('Retry-After', Math.ceil(error.msBeforeNext / 1000));
  }
  
  // Send response
  const retryAfter = Math.ceil(error.msBeforeNext / 1000);
  const responseBody = config.rate_limit_response.body.replace('$retry_after', retryAfter);
  
  res.status(config.rate_limit_response.status_code)
    .type(config.rate_limit_response.content_type)
    .send(responseBody);
};

module.exports = rateLimiter;
EOF
    
    echo -e "${GREEN}Express.js rate limiting middleware created: ${middleware_dir}/rateLimiter.js${NC}"
    
    # Create example of how to use the middleware
    cat > "${middleware_dir}/README.md" << EOF
# Rate Limiting Middleware

This directory contains middleware for implementing production-grade rate limiting in the AI Sports Edge API.

## Usage

To use the rate limiting middleware in your Express.js application:

\`\`\`javascript
const express = require('express');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// Apply rate limiting middleware globally
app.use(rateLimiter);

// Or apply to specific routes
app.use('/api', rateLimiter);

// Define your routes
app.get('/api/predictions', (req, res) => {
  // Your route handler
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
\`\`\`

## Configuration

The rate limiting configuration is stored in \`config/security/rate-limit-config.json\`. You can modify this file to adjust the rate limits for different endpoints and user tiers.

## Dependencies

This middleware requires the following npm packages:

\`\`\`
npm install redis rate-limiter-flexible
\`\`\`

## Redis Configuration

Make sure Redis is running and accessible with the configuration specified in the rate limit config file.
EOF
    
    echo -e "${GREEN}Express.js rate limiting documentation created: ${middleware_dir}/README.md${NC}"
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init                Initialize rate limiting configuration"
    echo "  --nginx               Configure Nginx rate limiting"
    echo "  --api-gateway         Configure AWS API Gateway rate limiting"
    echo "  --redis               Configure Redis for rate limiting"
    echo "  --express             Configure Express.js rate limiting"
    echo "  --all                 Configure all rate limiting components"
    echo "  --help                Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --init                  # Initialize rate limiting configuration"
    echo "  $0 --all                   # Configure all rate limiting components"
    echo "  $0 --nginx                 # Configure only Nginx rate limiting"
}

# Main function
main() {
    # Create directories
    create_directories
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    while [ $# -gt 0 ]; do
        case $1 in
            --init)
                create_rate_limit_config
                exit 0
                ;;
            --nginx)
                if [ ! -f "${RATE_LIMIT_CONFIG}" ]; then
                    echo -e "${RED}Error: Rate limit configuration file not found: ${RATE_LIMIT_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                configure_nginx_rate_limiting
                exit 0
                ;;
            --api-gateway)
                if [ ! -f "${RATE_LIMIT_CONFIG}" ]; then
                    echo -e "${RED}Error: Rate limit configuration file not found: ${RATE_LIMIT_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                configure_api_gateway_rate_limiting
                exit 0
                ;;
            --redis)
                if [ ! -f "${RATE_LIMIT_CONFIG}" ]; then
                    echo -e "${RED}Error: Rate limit configuration file not found: ${RATE_LIMIT_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                configure_redis_rate_limiting
                exit 0
                ;;
            --express)
                if [ ! -f "${RATE_LIMIT_CONFIG}" ]; then
                    echo -e "${RED}Error: Rate limit configuration file not found: ${RATE_LIMIT_CONFIG}${NC}"
                    echo "Run '$0 --init' to create the configuration file."
                    exit 1
                fi
                
                configure_express_rate_limiting
                exit 0
                ;;
            --all)
                create_rate_limit_config
                configure_nginx_rate_limiting
                configure_api_gateway_rate_limiting
                configure_redis_rate_limiting
                configure_express_rate_limiting
                
                echo -e "${GREEN}All rate limiting components configured successfully.${NC}"
                exit 0
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Error: Unknown option $1${NC}"
                show_help
                exit 1
                ;;
        esac
        shift
    done
}

# Run the main function
main "$@"