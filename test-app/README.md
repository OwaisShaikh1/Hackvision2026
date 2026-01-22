# SmartOffline SDK Test App

A simple React app to test the SmartOffline SDK's caching capabilities.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## How to Test

1. **Initial Load**
   - Click "Fetch Posts" - data loads from network
   - Check browser console for SDK debug logs

2. **Test Offline Caching**
   - Open DevTools (F12)
   - Go to Network tab
   - Change "Online" dropdown to "Offline"
   - Click "Fetch Posts" again
   - ✅ Data loads from cache!

3. **Check Cache Status**
   - Click "Check Cache" to see cached entries
   - View cached URLs in the cache info section

4. **Test Different APIs**
   - Click "Fetch Users" to cache different endpoint
   - Go offline and try fetching again

## Features Tested

- ✅ Service Worker registration
- ✅ API response caching
- ✅ Offline fallback
- ✅ Cache inspection
- ✅ Online/offline detection
- ✅ Debug logging

## Troubleshooting

**Service Worker not registering?**
- Check browser console for errors
- Ensure `smart-offline-sw.js` is in the `public/` folder
- Try hard refresh (Ctrl+Shift+R)

**Data not loading offline?**
- Fetch data while online first (to cache it)
- Check Network tab is set to "Offline"
- Verify cache exists with "Check Cache" button

**SDK errors?**
- Make sure you're using version 0.1.4+
- Check console for initialization errors
- Ensure HTTPS or localhost (Service Workers requirement)
