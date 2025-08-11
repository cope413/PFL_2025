#!/bin/bash

echo "🚀 Quick restart for PFL..."

# Kill existing processes
echo "🔪 Killing existing processes..."
pkill -f "next start" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Check if port 3000 is in use and kill if needed
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Port 3000 is in use. Killing processes..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Remove only .next directory for faster cleanup
if [ -d ".next" ]; then
    echo "🗑️ Removing .next directory..."
    rm -rf .next
fi

# Quick build
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
    
    # Start server
    echo "🚀 Starting production server..."
    npm start &
    
    echo "⏳ Waiting for server to start..."
    sleep 5
    
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Server is running on http://localhost:3000"
        echo "🎉 Quick restart completed!"
    else
        echo "❌ Server failed to start"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi
