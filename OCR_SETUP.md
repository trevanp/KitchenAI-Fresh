# OCR Setup Guide for KitchenAI

## Current Status
Your app is currently using **mock OCR** for testing. To enable real receipt scanning, follow these steps:

## Step 1: Get Google Vision API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Cloud Vision API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

## Step 2: Update Your .env File

Replace the placeholder in your `.env` file:

```bash
# Current (mock mode)
GOOGLE_VISION_API_KEY=paste_your_api_key_here

# Replace with your real API key
GOOGLE_VISION_API_KEY=AIzaSyC...your_actual_api_key_here
```

## Step 3: Test the Integration

1. Restart your Expo development server:
   ```bash
   npx expo start --clear
   ```

2. Try scanning a receipt - you should see:
   - "Real OCR enabled" in the image preview
   - Faster processing with real text extraction
   - More accurate item detection

## Features

### Real OCR Benefits:
- ✅ **Accurate text extraction** from any receipt format
- ✅ **Fast processing** (2-5 seconds)
- ✅ **High confidence** item detection
- ✅ **Automatic fallback** to mock if API fails

### Mock OCR (Current):
- ✅ **Works offline** for testing
- ✅ **No API costs** during development
- ✅ **Consistent results** for demos
- ⚠️ **Limited accuracy** compared to real OCR

## Error Handling

The app automatically handles:
- **Invalid API keys** → Falls back to mock OCR
- **Network timeouts** → Falls back to mock OCR
- **API quota exceeded** → Falls back to mock OCR
- **Image format errors** → Shows helpful error messages

## Cost Information

Google Vision API pricing (as of 2024):
- **First 1,000 requests/month**: FREE
- **Additional requests**: $1.50 per 1,000 requests
- **Typical receipt**: 1 API request per scan

For a busy family scanning 50 receipts/month, cost would be approximately **$0.07/month**.

## Troubleshooting

### "API key is invalid" error:
1. Check that your API key is correctly copied
2. Ensure Cloud Vision API is enabled
3. Verify billing is set up (required for API usage)

### "No text detected" error:
1. Try a clearer, better-lit photo
2. Ensure receipt text is readable
3. Avoid blurry or angled shots

### Network errors:
1. Check your internet connection
2. Try again in a few moments
3. App will automatically fall back to mock OCR

## Support

The app is designed to work seamlessly whether you have a real API key or not. Busy moms can start using it immediately with mock OCR and upgrade to real OCR when ready! 