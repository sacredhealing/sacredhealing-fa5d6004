

# Google Search Console Verification

## Overview
Add Google Search Console verification to your Sacred Healing website using two complementary methods for maximum compatibility.

## What Will Be Done

### 1. Add Meta Tag Verification
Add the Google site verification meta tag to the `<head>` section of `index.html`:

```html
<meta name="google-site-verification" content="googlea196464a6c9e0ab7" />
```

### 2. Add HTML File Verification (Backup Method)
Copy the uploaded verification file to the `public/` folder so it's accessible at:
`https://sacredhealing.lovable.app/googlea196464a6c9e0ab7.html`

This provides a fallback verification method and ensures Google can verify your site ownership.

## Files to Modify
- `index.html` - Add meta tag to `<head>` section
- `public/googlea196464a6c9e0ab7.html` - Copy verification file

## After Implementation
1. **Publish** your app to deploy changes to production
2. Return to Google Search Console and click **Verify**
3. Google will confirm your site ownership

