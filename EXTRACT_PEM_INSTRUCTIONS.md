# Extract PEM for Google Play Upload Key Reset

## Step 1: Add your files
1. Extract the ZIP you downloaded from Google Play Console
2. Copy `signing.keystore` into this project folder: `sacredhealing-main/`
3. Copy `signing-key-info.txt` into the same folder (contains your alias and password)

## Step 2: Find your alias
Open `signing-key-info.txt` and find the **alias** (often `alias` or your app name like `sacredhealing`).

## Step 3: Run the keytool command
In Cursor's terminal, run (replace `YOUR_ALIAS` with your actual alias):

```bash
keytool -export -rfc -keystore signing.keystore -alias YOUR_ALIAS -file upload_certificate.pem
```

**Example** (if your alias is `sacredhealing`):
```bash
keytool -export -rfc -keystore signing.keystore -alias sacredhealing -file upload_certificate.pem
```

When prompted, enter the **password** from your signing-key-info.txt. You won't see characters as you type—this is normal.

## Step 4: Upload to Google Play
A new file `upload_certificate.pem` will appear in your project folder. Upload this file in Google Play Console when you request the "Upload key reset."
