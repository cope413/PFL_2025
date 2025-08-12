# 🧹 PFL Cleanup & Rebuild Guide

## Why Does Formatting Break After Rebuilds?

The formatting issues you experience after rebuilds are caused by:

1. **Corrupted build artifacts** - Old `.next` directory with mismatched CSS/JS chunks
2. **Port conflicts** - Multiple Next.js processes trying to use port 3000
3. **Stale dependencies** - Cached packages that conflict with new builds
4. **Incomplete cleanup** - Previous builds leaving behind corrupted files

## 🚀 Available Cleanup Scripts

### 1. **Full Clean Rebuild** (Recommended for major issues)
```bash
npm run clean-rebuild
# or
./scripts/clean-rebuild.sh
```

**What it does:**
- ✅ Kills ALL Next.js and Node processes
- ✅ Removes `.next` build directory
- ✅ Removes `package-lock.json`
- ✅ Cleans npm cache
- ✅ Reinstalls all dependencies
- ✅ Builds project from scratch
- ✅ Starts production server

**Use when:**
- Formatting is completely broken
- Build errors persist
- Major dependency changes
- After pulling new code

### 2. **Quick Restart** (For minor issues)
```bash
npm run quick-restart
# or
./scripts/quick-restart.sh
```

**What it does:**
- ✅ Kills existing Next.js processes
- ✅ Removes only `.next` directory
- ✅ Quick rebuild
- ✅ Restarts server

**Use when:**
- Minor formatting issues
- Need to restart quickly
- Small code changes

## 🛠️ Manual Cleanup Commands

If you prefer to run commands manually:

### Kill Processes
```bash
# Kill all Next.js processes
pkill -f "next start"
pkill -f "next dev"

# Kill processes on specific port
lsof -ti:3000 | xargs kill -9
```

### Clean Build Artifacts
```bash
# Remove build directory
rm -rf .next

# Remove package lock (optional)
rm package-lock.json

# Clean npm cache
npm cache clean --force
```

### Rebuild
```bash
# Install dependencies
npm install --legacy-peer-deps

# Build project
npm run build

# Start server
npm start
```

## 🔍 Troubleshooting Common Issues

### Issue: "Port 3000 already in use"
```bash
# Check what's using the port
lsof -i :3000

# Kill the process
lsof -ti:3000 | xargs kill -9
```

### Issue: "Cannot find module" errors
```bash
# Full cleanup needed
npm run clean-rebuild
```

### Issue: CSS not loading
```bash
# Clear browser cache
# Or use incognito mode
# Then run quick restart
npm run quick-restart
```

### Issue: Build fails with dependency errors
```bash
# Full cleanup needed
npm run clean-rebuild
```

## 📋 Best Practices

1. **Always use cleanup scripts** instead of manual commands
2. **Use full clean rebuild** when experiencing major issues
3. **Use quick restart** for minor issues or regular restarts
4. **Clear browser cache** if CSS issues persist
5. **Check for port conflicts** before starting server

## 🚨 When to Use Each Script

| Scenario | Script | Reason |
|----------|--------|---------|
| Formatting completely broken | `clean-rebuild` | Corrupted build artifacts |
| Build errors | `clean-rebuild` | Dependency conflicts |
| CSS not loading | `quick-restart` | Stale build files |
| Port conflicts | `quick-restart` | Process cleanup needed |
| After git pull | `clean-rebuild` | Fresh start needed |
| Minor code changes | `quick-restart` | Fast iteration |

## 💡 Pro Tips

- **Bookmark the scripts** for easy access
- **Use `Ctrl+C`** to stop the server before running cleanup
- **Check the terminal output** for any error messages
- **Wait for server confirmation** before testing in browser
- **Keep browser dev tools open** to monitor for errors

## 🔗 Quick Reference

```bash
# For major issues
npm run clean-rebuild

# For minor issues
npm run quick-restart

# Manual process kill
pkill -f "next start"

# Check port usage
lsof -i :3000
```

---

**Remember:** The cleanup scripts are designed to solve the exact formatting issues you've been experiencing. Use them whenever you encounter problems, and the formatting should remain stable! 🎉

