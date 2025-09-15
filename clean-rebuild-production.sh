#!/bin/bash

# Full Clean and Rebuild Script for Production Server
# This script kills all processes, cleans build artifacts, and rebuilds from scratch

echo "🚀 Starting full clean and rebuild of production server..."

# Step 1: Kill all Next.js processes
echo "📋 Step 1: Killing all Next.js processes..."
pkill -9 -f "next" || true

# Step 2: Free port 3000
echo "📋 Step 2: Freeing port 3000..."
fuser -k 3000/tcp || true

# Step 3: Wait a moment for processes to fully terminate
echo "📋 Step 3: Waiting for processes to terminate..."
sleep 2

# Step 4: Verify port is free
echo "📋 Step 4: Verifying port 3000 is free..."
if netstat -tlnp | grep :3000 > /dev/null; then
    echo "❌ Port 3000 is still in use. Trying to force kill..."
    fuser -k 3000/tcp || true
    sleep 2
else
    echo "✅ Port 3000 is free"
fi

# Step 5: Clean all build artifacts
echo "📋 Step 5: Cleaning build artifacts..."
rm -rf .next node_modules package-lock.json
echo "✅ Build artifacts cleaned"

# Step 6: Install dependencies
echo "📋 Step 6: Installing dependencies..."
npm install --legacy-peer-deps
echo "✅ Dependencies installed"

# Step 7: Build production bundle
echo "📋 Step 7: Building production bundle..."
npm run build
echo "✅ Production build completed"

# Step 8: Start production server
echo "📋 Step 8: Starting production server..."
npm start &
SERVER_PID=$!

# Step 9: Wait for server to start
echo "📋 Step 9: Waiting for server to start..."
sleep 5

# Step 10: Test server health
echo "📋 Step 10: Testing server health..."
if curl -s http://localhost:3000/api/current-week > /dev/null; then
    echo "✅ Server is running and responding on port 3000"
    echo "🌐 Application available at: http://localhost:3000"
else
    echo "❌ Server failed to start or is not responding"
    echo "🔍 Check the logs above for any errors"
    exit 1
fi

echo ""
echo "🎉 Full clean and rebuild completed successfully!"
echo "📊 Server PID: $SERVER_PID"
echo "🔗 Access your application at: http://localhost:3000"
