#!/bin/bash

echo "🧹 Starting comprehensive cleanup and rebuild process..."

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Port $port is in use. Killing processes..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to kill all Next.js and Node processes
kill_processes() {
    echo "🔪 Killing all Next.js and Node processes..."
    
    # Kill processes by name
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next start" 2>/dev/null || true
    pkill -f "node.*next" 2>/dev/null || true
    
    # Kill processes by port
    check_port 3000
    check_port 3001
    check_port 3002
    
    # Force kill any remaining Node processes (be careful with this)
    # pkill -f "node" 2>/dev/null || true
    
    sleep 3
    echo "✅ Process cleanup completed"
}

# Function to clean build artifacts
clean_build_artifacts() {
    echo "🗑️ Cleaning build artifacts..."
    
    # Remove Next.js build directory
    if [ -d ".next" ]; then
        rm -rf .next
        echo "✅ Removed .next directory"
    fi
    
    # Remove node_modules cache
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        echo "✅ Removed node_modules cache"
    fi
    
    # Remove package-lock.json and reinstall
    if [ -f "package-lock.json" ]; then
        rm package-lock.json
        echo "✅ Removed package-lock.json"
    fi
    
    # Clean npm cache
    npm cache clean --force 2>/dev/null || true
    echo "✅ Cleaned npm cache"
    
    echo "✅ Build artifacts cleanup completed"
}

# Function to reinstall dependencies
reinstall_dependencies() {
    echo "📦 Reinstalling dependencies..."
    
    # Install dependencies with legacy peer deps to avoid conflicts
    npm install --legacy-peer-deps
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
}

# Function to build the project
build_project() {
    echo "🔨 Building project..."
    
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ Build completed successfully"
    else
        echo "❌ Build failed"
        exit 1
    fi
}

# Function to start the server
start_server() {
    echo "🚀 Starting production server..."
    
    # Start in background
    npm start &
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    sleep 10
    
    # Check if server is running
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Server is running on http://localhost:3000"
    else
        echo "❌ Server failed to start"
        exit 1
    fi
}

# Main execution
main() {
    echo "🚀 PFL Clean Rebuild Script"
    echo "================================"
    
    # Kill all processes
    kill_processes
    
    # Clean build artifacts
    clean_build_artifacts
    
    # Reinstall dependencies
    reinstall_dependencies
    
    # Build project
    build_project
    
    # Start server
    start_server
    
    echo ""
    echo "🎉 Clean rebuild completed successfully!"
    echo "🌐 Server is running at: http://localhost:3000"
    echo "📱 Draft room available at: http://localhost:3000/draft"
    echo ""
    echo "💡 To stop the server, run: pkill -f 'next start'"
    echo "💡 To view logs, run: tail -f /dev/null (server is running in background)"
}

# Run main function
main "$@"

