#!/bin/bash

echo "🏃‍♂️ Starting Sports Fitness App for Mobile Testing..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the sports-app-fixed directory"
    exit 1
fi

# Kill any existing expo processes
echo "🔄 Stopping any existing servers..."
pkill -f "expo start" 2>/dev/null || true
sleep 2

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "🌐 Your local IP address: $LOCAL_IP"

echo ""
echo "📱 Choose your testing method:"
echo "1. Web Browser (http://localhost:8081)"
echo "2. Mobile with QR Code (Expo Go app)"
echo "3. Mobile with IP address (http://$LOCAL_IP:8081)"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🚀 Starting web version..."
        npx expo start --web
        ;;
    2)
        echo "📱 Starting with QR code for mobile..."
        echo "   Install Expo Go app on your phone first!"
        npx expo start --tunnel
        ;;
    3)
        echo "🌐 Starting with LAN access..."
        echo "   Access from mobile: http://$LOCAL_IP:8081"
        npx expo start --lan
        ;;
    *)
        echo "❌ Invalid choice. Starting web version..."
        npx expo start --web
        ;;
esac

echo ""
echo "✅ App started! Test all features on your mobile device."
echo "📋 Check MOBILE_TESTING_GUIDE.md for detailed testing instructions."
