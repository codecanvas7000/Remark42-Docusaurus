#!/bin/bash

# Remark42 Setup Script for Linux/macOS
# This script helps you start the Remark42 comment system

set -e

echo "🚀 Starting Remark42 Comment System Setup"
echo "========================================"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed."
    echo "📦 Please install ngrok from: https://ngrok.com/download"
    exit 1
fi

echo "✅ Docker and ngrok are available"

# Start ngrok in the background - Fixed port to match nginx proxy
echo "🔗 Starting ngrok tunnel..."
ngrok http 8081 --log=stdout --log-level=warn > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
echo "⏳ Waiting for ngrok to initialize..."
sleep 8

# Get the ngrok URL with better error handling (try both jq and grep methods)
echo "🔍 Getting ngrok tunnel URL..."
NGROK_URL=""
for i in {1..10}; do
    # Try jq first (more reliable)
    if command -v jq &> /dev/null; then
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | jq -r '.tunnels[] | select(.proto == "https") | .public_url' 2>/dev/null)
    else
        # Fallback to grep method
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[a-f0-9]*\.ngrok-free\.app' | head -1)
    fi
    
    if [[ -n "$NGROK_URL" && "$NGROK_URL" != "null" ]]; then
        break
    fi
    echo "⏳ Attempt $i/10: Waiting for ngrok to provide URL..."
    sleep 2
done

if [[ -z "$NGROK_URL" || "$NGROK_URL" == "null" ]]; then
    echo "❌ Failed to get ngrok URL"
    echo "💡 Troubleshooting steps:"
    echo "   1. Make sure ngrok is properly configured with your authtoken"
    echo "   2. Visit: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "   3. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo "   4. Check if ngrok is running: http://localhost:4040"
    echo "   5. Install jq for better parsing: sudo apt install jq / brew install jq"
    
    # Kill ngrok process
    kill $NGROK_PID 2>/dev/null || true
    exit 1
fi

echo "✅ ngrok tunnel created: $NGROK_URL"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "📦 Please install Node.js from: https://nodejs.org/"
    kill $NGROK_PID 2>/dev/null || true
    exit 1
fi

# Update configuration
echo "⚙️ Updating configuration files..."
echo "🐛 DEBUG: Current directory: $(pwd)"
echo "🐛 DEBUG: NGROK_URL: $NGROK_URL"

if [[ -f "update-ngrok.js" ]]; then
    echo "🐛 DEBUG: Found update-ngrok.js, calling node script..."
    if ! node update-ngrok.js "$NGROK_URL"; then
        echo "❌ Failed to update configuration (exit code: $?)"
        kill $NGROK_PID 2>/dev/null || true
        exit 1
    fi
    echo "✅ Configuration updated successfully"
else
    echo "❌ update-ngrok.js not found in current directory"
    echo "💡 Make sure you're running this script from the project root directory"
    echo "📁 Current directory: $(pwd)"
    ls -la update-ngrok.js 2>/dev/null || echo "File not found"
    kill $NGROK_PID 2>/dev/null || true
    exit 1
fi

# Wait for Docker to be ready
echo "⏳ Waiting for Remark42 server to be ready..."
sleep 15

# Test if Remark42 is responding
echo "🧪 Testing Remark42 server..."
if curl -s --connect-timeout 10 --max-time 10 "$NGROK_URL/api/v1/ping" >/dev/null 2>&1; then
    echo "✅ Remark42 server is ready!"
else
    echo "⚠️ Remark42 server is still starting up (this may take a moment)"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "📝 Remark42 URL: $NGROK_URL"
echo "🌐 Blog URL: http://localhost:3000"
echo "🔗 ngrok Dashboard: http://localhost:4040"
echo ""
echo "Next steps:"
echo "1. Start your Docusaurus dev server: npm start"
echo "2. Visit http://localhost:3000 and navigate to any blog post"
echo "3. You should see the Remark42 comment widget"
echo ""
echo "💡 Keep this terminal open - ngrok is running in the background"
echo "🛑 Press Ctrl+C to stop ngrok when you're done"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping ngrok..."
    kill $NGROK_PID 2>/dev/null || true
    rm -f ngrok.log 2>/dev/null || true
    echo "✅ ngrok stopped."
    echo "👋 Goodbye!"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Keep the script running so ngrok stays active
echo "⏸️ Press Ctrl+C to stop ngrok and exit..."
while true; do
    sleep 1
    # Check if ngrok process is still running
    if ! kill -0 $NGROK_PID 2>/dev/null; then
        echo "❌ ngrok process stopped unexpectedly"
        echo "📋 Check ngrok.log for details:"
        cat ngrok.log 2>/dev/null || echo "No log file found"
        exit 1
    fi
done