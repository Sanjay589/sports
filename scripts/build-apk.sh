#!/bin/bash

echo "🚀 Building Sports Fitness App for Android..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Login to Expo (if not already logged in)
echo "🔐 Checking Expo authentication..."
eas whoami || eas login

# Build APK for Android
echo "📱 Building Android APK..."
eas build --platform android --profile preview

echo "✅ Build process initiated! Check your Expo dashboard for progress."
echo "📲 Once complete, you can download and install the APK on any Android device."
