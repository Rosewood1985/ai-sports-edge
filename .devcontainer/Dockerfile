FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install required packages including Node.js and npm
RUN apt-get update && apt-get install -y make cron bash nodejs npm && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set proper permissions for cron
RUN chmod 0644 /etc/crontab