#!/bin/bash

# PFL Lineup Warnings Cron Job Setup Script
# This script sets up a cron job to automatically send lineup warnings
# every Saturday at 5pm EST to teams that don't have saved lineups.

echo "🚀 PFL Lineup Warnings Cron Job Setup"
echo "===================================="

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WARNING_SCRIPT="$PROJECT_DIR/scripts/send-lineup-warnings.js"

echo "📁 Project directory: $PROJECT_DIR"
echo "📄 Warning script: $WARNING_SCRIPT"

# Check if the warning script exists
if [ ! -f "$WARNING_SCRIPT" ]; then
    echo "❌ Error: Warning script not found at $WARNING_SCRIPT"
    exit 1
fi

# Make sure the script is executable
chmod +x "$WARNING_SCRIPT"

# Create the cron job entry
# Run every Saturday at 5pm EST (which is 10pm UTC during standard time, 9pm UTC during daylight time)
# We'll use 10pm UTC to be safe (covers both EST and EDT)
CRON_JOB="0 22 * * 6 cd $PROJECT_DIR && node scripts/send-lineup-warnings.js >> logs/lineup-warnings.log 2>&1"

echo ""
echo "📅 Cron job to be created:"
echo "   $CRON_JOB"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "send-lineup-warnings.js"; then
    echo "⚠️  A lineup warnings cron job already exists!"
    echo ""
    echo "Current cron jobs:"
    crontab -l 2>/dev/null | grep -E "(lineup-warnings|PFL)" || echo "   (none found)"
    echo ""
    
    read -p "Do you want to replace the existing cron job? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 0
    fi
    
    # Remove existing lineup warnings cron jobs
    echo "🗑️  Removing existing lineup warnings cron jobs..."
    (crontab -l 2>/dev/null | grep -v "send-lineup-warnings.js") | crontab -
fi

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Add the new cron job
echo "📝 Adding new cron job..."
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

# Verify the cron job was added
if crontab -l 2>/dev/null | grep -q "send-lineup-warnings.js"; then
    echo "✅ Cron job added successfully!"
    echo ""
    echo "📋 Current cron jobs:"
    crontab -l 2>/dev/null | grep -E "(lineup-warnings|PFL)" || echo "   (none found)"
    echo ""
    echo "📝 The cron job will:"
    echo "   - Run every Saturday at 5pm EST (10pm UTC)"
    echo "   - Check for teams without saved lineups"
    echo "   - Send warning emails to those teams"
    echo "   - Log output to logs/lineup-warnings.log"
    echo ""
    echo "🧪 To test the script manually:"
    echo "   cd $PROJECT_DIR"
    echo "   node scripts/send-lineup-warnings.js --force"
    echo ""
    echo "📊 To view logs:"
    echo "   tail -f logs/lineup-warnings.log"
    echo ""
    echo "🎉 Setup completed successfully!"
else
    echo "❌ Failed to add cron job"
    exit 1
fi
