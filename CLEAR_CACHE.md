# 🔄 Clear Browser Cache to See Updated UI

If you're seeing the **old meditation styles** (Ocean, Forest, Shamanic, Indian, Relaxing, Mystic) instead of the **15 new meditation/healing audio types**, clear your browser cache.

## Quick Fix (Hard Refresh)

**Chrome / Edge / Brave:**
- **Windows/Linux:** Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac:** Press `Cmd + Shift + R`

**Firefox:**
- **Windows/Linux:** Press `Ctrl + F5` or `Ctrl + Shift + R`
- **Mac:** Press `Cmd + Shift + R`

**Safari:**
- **Mac:** Press `Cmd + Option + R`

## Full Cache Clear (If Hard Refresh Doesn't Work)

### Chrome / Edge:
1. Open **DevTools** (F12 or Right-click → Inspect)
2. Go to **Application** tab
3. Click **Clear storage** (left sidebar)
4. Check **Cached images and files**
5. Click **Clear site data**

### Firefox:
1. Open **DevTools** (F12)
2. Go to **Storage** tab
3. Right-click **Cache** → **Delete All**

### Safari:
1. Open **Develop** menu (enable in Preferences → Advanced)
2. Click **Empty Caches**
3. Or: Safari → Preferences → Advanced → **Show Develop menu in menu bar**

## Verify the Update

After clearing cache, look for:
1. **Build Marker:** `BUILD_MARKER: MED15TYPES_15FREQS_V2` at top of page (yellow banner)
2. **Meditation Style Dropdown:** Should show label "🧘‍♂️ Meditation / Healing Audio Type"
3. **15 Options:** Should see all 15 meditation types (Indian (Vedic), Shamanic, Tibetan, etc.)
4. **Frequency Dropdown:** Should show all 15 frequencies (174 Hz, 285 Hz, etc.)

## If Still Not Working

1. **Restart Dev Server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Check Console for Errors:**
   - Open DevTools → Console
   - Look for any errors or warnings

3. **Verify File is Correct:**
   - File: `src/pages/CreativeSoulMeditation.tsx`
   - Line 507-528: Should show all 15 meditation styles
   - Line 434-454: Should show all 15 frequencies

## Current Status

✅ **Code is correct** - All 15 meditation styles are in the file
✅ **Build marker updated** - Forces cache refresh
✅ **Local cache cleared** - Build artifacts removed

**Next step:** Clear browser cache and hard refresh!

