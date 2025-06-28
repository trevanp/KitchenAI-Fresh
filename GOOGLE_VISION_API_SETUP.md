# Google Vision API Setup Guide

## 🎯 **Why Google Vision API?**

Google Vision API is the **best OCR solution** for receipt scanning because:
- ✅ **95%+ accuracy** for text extraction
- ✅ **2-5 second processing** time
- ✅ **Handles all receipt formats** (Walmart, Target, Kroger, etc.)
- ✅ **Production-ready** and reliable
- ✅ **Cost-effective** ($1.50 per 1000 requests)

## 🚀 **Step-by-Step Setup**

### **Step 1: Create Google Cloud Account**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select existing one

### **Step 2: Enable Vision API**
1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"Cloud Vision API"**
3. Click on **Cloud Vision API**
4. Click **"Enable"**

### **Step 3: Create API Key**
1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the generated API key
4. **Important**: Click **"Restrict Key"** and:
   - Set **Application restrictions** to "HTTP referrers"
   - Add your domain or set to "None" for testing
   - Set **API restrictions** to "Cloud Vision API"

### **Step 4: Add API Key to App**
1. Open your `.env` file in the project root
2. Replace the placeholder with your real API key:
   ```
   GOOGLE_VISION_API_KEY=your_actual_api_key_here
   ```
3. Save the file

### **Step 5: Restart App**
1. Stop your Expo development server (Ctrl+C)
2. Run `npx expo start --clear`
3. Test the OCR functionality

## 💰 **Pricing & Costs**

### **Free Tier:**
- **1,000 requests per month** - **FREE**
- Perfect for testing and light usage

### **Paid Tier:**
- **$1.50 per 1,000 requests** after free tier
- **$0.0015 per request** (very affordable)
- **No monthly fees** - pay only for what you use

### **Cost Examples:**
- **100 receipts per month**: $0.15
- **500 receipts per month**: $0.75
- **1,000 receipts per month**: $1.50

## 🔒 **Security Best Practices**

### **API Key Security:**
1. **Never commit** API key to public repositories
2. **Use environment variables** (already implemented)
3. **Restrict API key** to Cloud Vision API only
4. **Set up billing alerts** to monitor usage

### **Production Setup:**
1. **Enable billing** on your Google Cloud account
2. **Set up usage quotas** to prevent unexpected charges
3. **Monitor usage** in Google Cloud Console
4. **Consider API key rotation** for security

## 🧪 **Testing Your Setup**

### **Test API Key:**
1. Add your API key to `.env` file
2. Restart the app
3. Check the OCR status indicator in the Pantry tab
4. Should show "Real OCR enabled (Google Vision API)"

### **Test Receipt Scanning:**
1. Take a photo of a real receipt
2. Wait 2-5 seconds for processing
3. See real items extracted from your receipt
4. Different receipts should show different results

## 🔧 **Troubleshooting**

### **"API key is invalid" error:**
- ✅ Check that API key is correctly copied
- ✅ Ensure Vision API is enabled
- ✅ Verify API key restrictions allow your app
- ✅ Check billing is enabled

### **"Quota exceeded" error:**
- ✅ Check your usage in Google Cloud Console
- ✅ Wait for quota reset (monthly)
- ✅ Upgrade to paid tier if needed

### **"Network error" error:**
- ✅ Check internet connection
- ✅ Verify API key is valid
- ✅ Check Google Cloud Console for service status

### **"No text detected" error:**
- ✅ Try a clearer, better-lit photo
- ✅ Ensure receipt text is readable
- ✅ Avoid shadows or glare
- ✅ Try a different receipt

## 📊 **Performance Comparison**

| Feature | Mock OCR | Google Vision API |
|---------|----------|-------------------|
| **Accuracy** | 0% (fake data) | 95%+ |
| **Speed** | Instant (fake) | 2-5 seconds |
| **Real Data** | ❌ | ✅ |
| **Cost** | Free | $1.50/1000 requests |
| **Reliability** | Always works | Production-grade |

## 🎉 **Benefits of Real OCR**

### **For Users:**
- **Real receipt scanning** - no more fake data
- **Accurate item detection** - real prices and quantities
- **Fast processing** - 2-5 seconds per receipt
- **Works with any receipt** - all store formats supported

### **For Development:**
- **Production-ready** solution
- **Scalable** - handles any volume
- **Reliable** - Google's infrastructure
- **Cost-effective** - very affordable

## 🚀 **Next Steps**

1. **Get your API key** following the steps above
2. **Test with real receipts** to see the difference
3. **Monitor usage** in Google Cloud Console
4. **Enjoy real OCR functionality!**

## 💡 **Pro Tips**

1. **Start with free tier** - 1,000 requests per month is plenty for testing
2. **Set up billing alerts** to avoid unexpected charges
3. **Test with various receipt types** to see accuracy
4. **Keep API key secure** - never share publicly
5. **Monitor usage** regularly in Google Cloud Console

## 🎯 **Success!**

Once you've added your Google Vision API key, your KitchenAI app will have **real OCR functionality** that actually reads receipt text and extracts real grocery items. No more mock data - just genuine, accurate receipt scanning for busy moms! 