#!/bin/bash

# Full Clean and Rebuild Script for Production Server
# This script kills all processes, cleans build artifacts, and rebuilds from scratch

echo "🚀 Starting full clean and rebuild of production server..."

# Step 1: Kill all Next.js processes
echo "📋 Step 1: Killing all Next.js processes..."
pkill -9 -f "next" || true
pkill -9 -f "node.*next" || true
pkill -9 -f "next-server" || true

# Step 2: Free port 3000 - multiple methods
echo "📋 Step 2: Freeing port 3000..."
# Method 1: Use fuser to kill processes on the port
fuser -k 3000/tcp 2>/dev/null || true
# Method 2: Find and kill process using lsof
if command -v lsof > /dev/null; then
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
fi
# Method 3: Use netstat to find and kill process
if netstat -tlnp 2>/dev/null | grep :3000 > /dev/null; then
    PID=$(netstat -tlnp 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -1)
    if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
        kill -9 $PID 2>/dev/null || true
    fi
fi

# Step 3: Wait for processes to fully terminate
echo "📋 Step 3: Waiting for processes to terminate..."
sleep 3

# Step 4: Verify port is free and retry if needed
echo "📋 Step 4: Verifying port 3000 is free..."
MAX_RETRIES=3
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if netstat -tlnp 2>/dev/null | grep :3000 > /dev/null || (command -v lsof > /dev/null && lsof -i :3000 > /dev/null 2>&1); then
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "⚠️  Port 3000 is still in use. Retry $RETRY_COUNT/$MAX_RETRIES..."
        # Try all kill methods again
        fuser -k 3000/tcp 2>/dev/null || true
        lsof -ti :3000 | xargs kill -9 2>/dev/null || true
        pkill -9 -f "next" || true
        sleep 3
    else
        echo "✅ Port 3000 is free"
        break
    fi
done

# Final check - if still in use, show warning
if netstat -tlnp 2>/dev/null | grep :3000 > /dev/null || (command -v lsof > /dev/null && lsof -i :3000 > /dev/null 2>&1); then
    echo "⚠️  WARNING: Port 3000 may still be in use. Server start may fail."
    echo "   You may need to manually kill the process or wait a few seconds."
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

# Step 8: Final check before starting server
echo "📋 Step 8: Final check before starting server..."
if netstat -tlnp 2>/dev/null | grep :3000 > /dev/null || (command -v lsof > /dev/null && lsof -i :3000 > /dev/null 2>&1); then
    echo "❌ ERROR: Port 3000 is still in use. Cannot start server."
    echo "   Please manually kill the process using port 3000:"
    echo "   lsof -ti :3000 | xargs kill -9"
    echo "   or"
    echo "   fuser -k 3000/tcp"
    exit 1
fi

# Step 9: Start production server
echo "📋 Step 9: Starting production server..."
npm start &
SERVER_PID=$!

# Step 10: Wait for server to start
echo "📋 Step 10: Waiting for server to start..."
sleep 5

# Step 11: Test server health
echo "📋 Step 11: Testing server health..."
if curl -s http://localhost:3000/api/current-week > /dev/null; then
    echo "✅ Server is running and responding on port 3000"
    echo "🌐 Application available at: http://localhost:3000"
else
    echo "❌ Server failed to start or is not responding"
    echo "🔍 Check the logs above for any errors"
    echo "   The server process may have failed. Check with: ps aux | grep next"
    exit 1
fi

echo ""
echo "🎉 Full clean and rebuild completed successfully!"
echo "📊 Server PID: $SERVER_PID"
echo "🔗 Access your application at: http://localhost:3000"
