#!/bin/bash

# Sahasi App Startup Script
# This script starts the Expo development server with proper configuration

echo "🚀 Starting Sahasi App..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the sahasiApp directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clear any previous Metro bundler cache
echo "🧹 Clearing cache..."
rm -rf .expo

# Get local IP address
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
echo "📱 Your computer's IP: $IP_ADDRESS"
echo ""

# Start options
echo "Choose startup mode:"
echo "1) Standard mode (same WiFi required)"
echo "2) Tunnel mode (works anywhere, slower)"
echo "3) Clear cache and start"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🌐 Starting in standard mode..."
        npx expo start
        ;;
    2)
        echo "🔄 Starting in tunnel mode..."
        npx expo start --tunnel
        ;;
    3)
        echo "🧹 Clearing cache and starting..."
        npx expo start -c
        ;;
    *)
        echo "Invalid choice. Starting in standard mode..."
        npx expo start
        ;;
esac
