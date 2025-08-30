#!/bin/bash

# Remark42 Setup Script
# This script helps you start the Remark42 comment system

echo "🚀 Starting Remark42 Comment System Setup"
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
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

# Start ngrok in the background
echo "🔗 Starting ngrok tunnel..."
ngrok http 8080 > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
echo "⏳ Waiting for ngrok to initialize..."
sleep 8

# Get the ngrok URL with better error handling
echo "🔍 Getting ngrok tunnel URL..."
NGROK_URL=""
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[a-f0-9]*\.ngrok-free\.app' | head -1)
    if [[ ! -z "$NGROK_URL" ]]; then
        break
    fi
    sleep 2
    echo "   Attempt $i/10..."
done

if [[ -z "$NGROK_URL" ]]; then
    echo "❌ Failed to get ngrok URL"
    echo "💡 Troubleshooting steps:"
    echo "   1. Make sure ngrok is properly configured with your authtoken"
    echo "   2. Visit: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "   3. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo "   4. Check if ngrok is running: curl http://localhost:4040/api/tunnels"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ ngrok tunnel created: $NGROK_URL"

# Update configuration
echo "⚙️  Updating configuration files..."
if [ -f "update-ngrok.js" ]; then
    node update-ngrok.js "$NGROK_URL"
    if [ $? -eq 0 ]; then
        echo "✅ Configuration updated successfully"
    else
        echo "❌ Failed to update configuration"
        kill $NGROK_PID 2>/dev/null
        exit 1
    fi
else
    echo "❌ update-ngrok.js not found"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

# Check if Node.js is available
if ! command -v node > /dev/null 2>&1; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "📦 Please install Node.js from: https://nodejs.org/"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

# Wait for Docker to be ready
echo "⏳ Waiting for Remark42 server to be ready..."
sleep 15

# Test if Remark42 is responding
echo "🧪 Testing Remark42 server..."
if curl -s --max-time 10 "$NGROK_URL/api/v1/ping" > /dev/null 2>&1; then
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
echo "💡 Keep this terminal open - ngrok is running here"
echo "🛑 Press Ctrl+C to stop ngrok when you're done"

# Keep the script running so ngrok stays active
trap "echo ''; echo '🛑 Stopping ngrok...'; kill $NGROK_PID 2>/dev/null; exit 0" INT

echo ""
echo "⏸️  Press Ctrl+C to stop ngrok and exit..."

# Wait for interrupt
while true; do
    sleep 1
done