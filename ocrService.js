import * as FileSystem from 'expo-file-system';
import { GOOGLE_VISION_API_KEY } from '@env';

const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Real OCR extraction using Google Vision API with comprehensive debugging
export const extractTextFromImage = async (imageUri) => {
  const debugInfo = {
    step: 'Starting OCR extraction',
    imageUri: imageUri,
    apiKeyConfigured: !!GOOGLE_VISION_API_KEY,
    apiKeyLength: GOOGLE_VISION_API_KEY ? GOOGLE_VISION_API_KEY.length : 0,
    timestamp: new Date().toISOString()
  };
  
  console.log('🔍 OCR DEBUG - Starting extraction:', debugInfo);
  
  try {
    console.log('📸 OCR DEBUG - Image URI received:', imageUri);
    
    // Check if API key is available
    if (!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === 'paste_your_api_key_here') {
      console.log('⚠️ OCR DEBUG - No valid Google Vision API key found, using mock OCR');
      console.log('🔑 OCR DEBUG - API Key status:', {
        exists: !!GOOGLE_VISION_API_KEY,
        value: GOOGLE_VISION_API_KEY ? `${GOOGLE_VISION_API_KEY.substring(0, 10)}...` : 'undefined'
      });
      return {
        ...await mockExtractTextFromImage(imageUri),
        debugInfo: { ...debugInfo, step: 'Using mock OCR', reason: 'No API key' }
      };
    }
    
    console.log('🔑 OCR DEBUG - API Key configured, length:', GOOGLE_VISION_API_KEY.length);
    console.log('🌐 OCR DEBUG - Using Google Vision API for real OCR...');
    
    const googleResult = await extractTextWithGoogleVision(imageUri);
    console.log('📡 OCR DEBUG - Google Vision API response:', googleResult);
    
    if (googleResult.success && googleResult.text) {
      console.log('✅ OCR DEBUG - Google Vision API successful, parsing text...');
      const parsedResult = parseReceiptText(googleResult.text);
      console.log('📝 OCR DEBUG - Parsed result:', parsedResult);
      return {
        ...parsedResult,
        debugInfo: { ...debugInfo, step: 'OCR completed successfully', rawText: googleResult.text }
      };
    }
    
    // If Google Vision fails, return error with debug info
    console.log('❌ OCR DEBUG - Google Vision API failed:', googleResult);
    return {
      success: false,
      text: '',
      items: [],
      message: googleResult.message || 'Could not extract text from the receipt. Please try a clearer image.',
      debugInfo: { ...debugInfo, step: 'OCR failed', error: googleResult.message }
    };

  } catch (error) {
    console.error('💥 OCR DEBUG - Extraction error:', error);
    console.error('💥 OCR DEBUG - Error stack:', error.stack);
    
    const errorInfo = {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
    
    // Handle specific error types
    if (error.message.includes('API key') || error.message.includes('403')) {
      return {
        success: false,
        text: '',
        items: [],
        message: 'API key is invalid or quota exceeded. Please check your Google Vision API setup.',
        debugInfo: { ...debugInfo, step: 'API key error', error: errorInfo }
      };
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        success: false,
        text: '',
        items: [],
        message: 'Network error. Please check your internet connection and try again.',
        debugInfo: { ...debugInfo, step: 'Network error', error: errorInfo }
      };
    }
    
    if (error.message.includes('timeout')) {
      return {
        success: false,
        text: '',
        items: [],
        message: 'Request timed out. Please try again.',
        debugInfo: { ...debugInfo, step: 'Timeout error', error: errorInfo }
      };
    }
    
    return {
      success: false,
      text: '',
      items: [],
      message: `OCR processing failed: ${error.message}. Please try again.`,
      debugInfo: { ...debugInfo, step: 'General error', error: errorInfo }
    };
  }
};

// Google Vision API OCR with comprehensive error handling and debugging
const extractTextWithGoogleVision = async (imageUri) => {
  console.log('📖 OCR DEBUG - Reading image for Google Vision API...');
  
  try {
    // Read the image file and convert to base64
    console.log('📁 OCR DEBUG - Reading image file from URI:', imageUri);
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('📊 OCR DEBUG - Image converted to base64, size:', {
      base64Length: base64Image.length,
      sizeInMB: (base64Image.length * 0.75) / (1024 * 1024), // Approximate size
      firstChars: base64Image.substring(0, 50) + '...'
    });

    // Validate image size (Google Vision has limits)
    if (base64Image.length > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Image is too large. Please use a smaller image.');
    }

    // Prepare the request payload
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    };

    console.log('📤 OCR DEBUG - Sending request to Google Vision API...');
    console.log('🔗 OCR DEBUG - API URL:', `${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY.substring(0, 10)}...`);
    console.log('📋 OCR DEBUG - Request body structure:', {
      requestsCount: requestBody.requests.length,
      hasImage: !!requestBody.requests[0].image,
      hasContent: !!requestBody.requests[0].image.content,
      contentLength: requestBody.requests[0].image.content.length,
      features: requestBody.requests[0].features
    });

    // Make the API request with timeout and comprehensive error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    console.log('⏱️ OCR DEBUG - Starting API request with 30s timeout...');
    const startTime = Date.now();

    const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const endTime = Date.now();
    clearTimeout(timeoutId);

    console.log('📡 OCR DEBUG - API response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${endTime - startTime}ms`,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Handle different HTTP status codes
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OCR DEBUG - Google Vision API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        responseTime: `${endTime - startTime}ms`
      });
      
      switch (response.status) {
        case 400:
          throw new Error(`Invalid image format (400): ${errorText}`);
        case 401:
          throw new Error(`API key is invalid (401): ${errorText}`);
        case 403:
          throw new Error(`API key is invalid or quota exceeded (403): ${errorText}`);
        case 429:
          throw new Error(`API rate limit exceeded (429): ${errorText}`);
        case 500:
          throw new Error(`Google Vision API server error (500): ${errorText}`);
        case 503:
          throw new Error(`Google Vision API is temporarily unavailable (503): ${errorText}`);
        default:
          throw new Error(`API error (${response.status}): ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('✅ OCR DEBUG - Google Vision API response parsed successfully');
    console.log('📄 OCR DEBUG - Response structure:', {
      hasResponses: !!result.responses,
      responsesLength: result.responses ? result.responses.length : 0,
      hasError: !!result.error,
      error: result.error
    });

    // Check for API errors in the response body
    if (result.error) {
      console.error('❌ OCR DEBUG - API error in response body:', result.error);
      throw new Error(`Google Vision API error: ${result.error.message}`);
    }

    const textAnnotations = result.responses[0]?.textAnnotations;
    console.log('📝 OCR DEBUG - Text annotations found:', {
      hasAnnotations: !!textAnnotations,
      annotationsLength: textAnnotations ? textAnnotations.length : 0,
      firstAnnotation: textAnnotations ? textAnnotations[0] : null
    });
    
    if (!textAnnotations || textAnnotations.length === 0) {
      console.log('⚠️ OCR DEBUG - No text detected in image by Google Vision API');
      return {
        success: false,
        text: '',
        message: 'No text detected in the receipt. Please try again with a clearer image.',
        debugInfo: {
          responseTime: `${endTime - startTime}ms`,
          responseStatus: response.status,
          responseBody: result
        }
      };
    }

    // The first annotation contains the full text
    const fullText = textAnnotations[0].description;
    console.log('📄 OCR DEBUG - Extracted text from Google Vision API:', {
      textLength: fullText.length,
      textPreview: fullText.substring(0, 200) + (fullText.length > 200 ? '...' : ''),
      lineCount: fullText.split('\n').length
    });

    return {
      success: true,
      text: fullText,
      message: 'Successfully extracted text with Google Vision API',
      debugInfo: {
        responseTime: `${endTime - startTime}ms`,
        responseStatus: response.status,
        textLength: fullText.length,
        lineCount: fullText.split('\n').length
      }
    };

  } catch (error) {
    console.error('💥 OCR DEBUG - Google Vision API error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Re-throw the error for proper handling in the main function
    throw error;
  }
};

// Enhanced receipt text parsing for real OCR results
const parseReceiptText = (text) => {
  console.log('Parsing REAL receipt text from Google Vision API:', text);
  
  // Split text into lines and clean up
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length > 2);
  
  console.log('Cleaned lines from receipt:', lines);
  
  const items = [];
  
  // Enhanced patterns for real receipt formats
  const itemPatterns = [
    // Pattern for items like "BANANA 2.99" or "MILK 1/2 GAL 3.49"
    /^([A-Z\s]+)\s+([0-9]+\/[0-9]+\s+[A-Z]+|[0-9]+\s+[A-Z]+|[A-Z]+)\s+([0-9]+\.[0-9]{2})/i,
    // Pattern for items like "BREAD 1 LOAF 2.99"
    /^([A-Z\s]+)\s+([0-9]+\s+[A-Z]+)\s+([0-9]+\.[0-9]{2})/i,
    // Pattern for items like "EGGS 12 CT 4.99"
    /^([A-Z\s]+)\s+([0-9]+\s+[A-Z]+)\s+([0-9]+\.[0-9]{2})/i,
    // Pattern for items like "MILK 3.99" (simple format)
    /^([A-Z\s]+)\s+([0-9]+\.[0-9]{2})/i,
    // Pattern for items with quantity at end like "BANANA 2.99 1"
    /^([A-Z\s]+)\s+([0-9]+\.[0-9]{2})\s+([0-9]+)/i,
    // Pattern for items like "BANANA @ 0.59 1.18" (price per unit)
    /^([A-Z\s]+)\s+@\s+([0-9]+\.[0-9]{2})\s+([0-9]+\.[0-9]{2})/i,
    // Pattern for items like "MILK 1 GAL 4.99" (quantity in middle)
    /^([A-Z\s]+)\s+([0-9]+\s+[A-Z]+)\s+([0-9]+\.[0-9]{2})/i,
  ];

  // Keywords to skip (receipt metadata)
  const skipKeywords = [
    'TOTAL', 'TAX', 'SUBTOTAL', 'CHANGE', 'CASH', 'CARD', 'RECEIPT', 'STORE',
    'THANK', 'WELCOME', 'DATE', 'TIME', 'REGISTER', 'TRANSACTION', 'BALANCE',
    'PAYMENT', 'METHOD', 'REFUND', 'DISCOUNT', 'COUPON', 'SALE', 'CLEARANCE',
    'BALANCE', 'DUE', 'AMOUNT', 'CHANGE', 'CASH', 'CREDIT', 'DEBIT', 'CHECK'
  ];

  for (const line of lines) {
    console.log('Processing line:', line);
    
    // Skip lines that are likely totals, taxes, or headers
    const upperLine = line.toUpperCase();
    if (skipKeywords.some(keyword => upperLine.includes(keyword))) {
      console.log('Skipping line (metadata):', line);
      continue;
    }

    // Skip lines that are too short or too long
    if (line.length < 3 || line.length > 100) {
      continue;
    }

    // Try to match item patterns
    let matched = false;
    for (const pattern of itemPatterns) {
      const match = line.match(pattern);
      if (match) {
        const [, name, quantity, price] = match;
        const cleanName = cleanReceiptItemName(name.trim());
        
        // Skip if name is too short or contains only numbers
        if (cleanName.length < 2 || /^\d+$/.test(cleanName)) {
          continue;
        }
        
        console.log('Matched item:', { originalName: name.trim(), cleanName, quantity, price });
        
        items.push({
          name: cleanName,
          quantity: quantity || '1',
          price: parseFloat(price),
          category: categorizeItem(cleanName),
          confidence: 'high'
        });
        matched = true;
        break;
      }
    }

    // If no pattern matched, try to extract items using common grocery keywords
    if (!matched) {
      const groceryItem = extractGroceryItem(line);
      if (groceryItem) {
        // Clean the extracted item name
        groceryItem.name = cleanReceiptItemName(groceryItem.name);
        items.push(groceryItem);
      }
    }
  }

  console.log('Parsed items from real Google Vision OCR:', items);
  
  if (items.length === 0) {
    return {
      success: false,
      text: text,
      items: [],
      message: 'No grocery items detected in the receipt text. The receipt might be in an unrecognized format.',
    };
  }

  return {
    success: true,
    text: text,
    items: items,
    message: `Successfully extracted ${items.length} items from your receipt using Google Vision API!`,
  };
};

// Enhanced text cleaning function to convert store codes into readable ingredient names
const cleanReceiptItemName = (itemName) => {
  console.log('🧹 CLEANING ITEM NAME:', itemName);
  
  let cleanedName = itemName.toUpperCase().trim();
  
  // Store and brand prefix removal
  const storePrefixes = [
    'PUB ', 'PUBLIX ', 'HZ ', 'PF ', 'JIF ', 'RD ', 'FT ', 'W/G ', 'W/G WHEAT ',
    'ORGANIC ', 'ORG ', 'NATURAL ', 'NAT ', 'FRESH ', 'PREMIUM ', 'PREM '
  ];
  
  for (const prefix of storePrefixes) {
    if (cleanedName.startsWith(prefix)) {
      cleanedName = cleanedName.replace(prefix, '');
      console.log(`🗑️ Removed prefix "${prefix}" → "${cleanedName}"`);
    }
  }
  
  // Brand code mapping
  const brandMappings = {
    'HZ TOMATO KETCHUP': 'Ketchup',
    'HZ KETCHUP': 'Ketchup',
    'HZ MUSTARD': 'Mustard',
    'JIF RD FT': 'Peanut Butter',
    'JIF PEANUT BUTTER': 'Peanut Butter',
    'PF W/G WHEAT': 'Whole Grain Wheat Bread',
    'PF WHEAT': 'Wheat Bread',
    'PF WHITE': 'White Bread',
    'PUB DICED TOMATOES': 'Diced Tomatoes',
    'PUB CRUSHED TOMATOES': 'Crushed Tomatoes',
    'PUB TOMATO PASTE': 'Tomato Paste',
    'PUBLIX GREEN BEANS': 'Green Beans',
    'PUBLIX SWEET CORN': 'Sweet Corn',
    'BANANA SHALLOTS': 'Shallots',
    'ORGANIC BANANAS': 'Bananas',
    'ORGANIC CARROTS': 'Carrots',
    'ORGANIC SPINACH': 'Spinach',
    'ORGANIC LETTUCE': 'Lettuce',
    'ORGANIC TOMATOES': 'Tomatoes',
    'ORGANIC ONIONS': 'Onions',
    'ORGANIC POTATOES': 'Potatoes',
    'ORGANIC APPLES': 'Apples',
    'ORGANIC ORANGES': 'Oranges',
    'ORGANIC MILK': 'Milk',
    'ORGANIC EGGS': 'Eggs',
    'ORGANIC BREAD': 'Bread',
    'ORGANIC CHEESE': 'Cheese'
  };
  
  // Check for exact brand mappings first
  for (const [brandCode, readableName] of Object.entries(brandMappings)) {
    if (cleanedName === brandCode) {
      console.log(`🏷️ Brand mapping: "${brandCode}" → "${readableName}"`);
      return readableName;
    }
  }
  
  // Smart ingredient reordering and cleaning
  const reorderPatterns = [
    // "PEPPERS GREEN BELL" → "Green Bell Peppers"
    {
      pattern: /^PEPPERS\s+(GREEN|RED|YELLOW|ORANGE)\s+(BELL)$/i,
      replacement: (match, color, type) => `${color} ${type} Peppers`
    },
    // "BELL PEPPERS RED" → "Red Bell Peppers"
    {
      pattern: /^BELL\s+PEPPERS\s+(GREEN|RED|YELLOW|ORANGE)$/i,
      replacement: (match, color) => `${color} Bell Peppers`
    },
    // "TOMATO DICED" → "Diced Tomatoes"
    {
      pattern: /^TOMATO\s+(DICED|CHOPPED|CRUSHED|PUREE|PASTE|SAUCE)$/i,
      replacement: (match, form) => `${form} Tomatoes`
    },
    // "ONION YELLOW" → "Yellow Onions"
    {
      pattern: /^ONION\s+(YELLOW|WHITE|RED|SWEET|VIDALIA)$/i,
      replacement: (match, type) => `${type} Onions`
    },
    // "POTATO RUSSET" → "Russet Potatoes"
    {
      pattern: /^POTATO\s+(RUSSET|RED|YUKON|SWEET|IDAHO)$/i,
      replacement: (match, type) => `${type} Potatoes`
    },
    // "CARROT BABY" → "Baby Carrots"
    {
      pattern: /^CARROT\s+(BABY|MINI|REGULAR|ORGANIC)$/i,
      replacement: (match, size) => `${size} Carrots`
    },
    // "LETTUCE ROMAINE" → "Romaine Lettuce"
    {
      pattern: /^LETTUCE\s+(ROMAINE|ICEBERG|BUTTER|GREEN|RED|BIBB)$/i,
      replacement: (match, type) => `${type} Lettuce`
    },
    // "APPLE GRANNY SMITH" → "Granny Smith Apples"
    {
      pattern: /^APPLE\s+(GRANNY\s+SMITH|GALA|FUJI|HONEYCRISP|RED\s+DELICIOUS|BRAEBURN|PINK\s+LADY)$/i,
      replacement: (match, variety) => `${variety} Apples`
    },
    // "BANANA" → "Bananas" (pluralize single items)
    {
      pattern: /^BANANA$/i,
      replacement: () => 'Bananas'
    },
    // "MILK WHOLE" → "Whole Milk"
    {
      pattern: /^MILK\s+(WHOLE|SKIM|2%|1%|ALMOND|SOY|OAT|COCONUT|CASHEW)$/i,
      replacement: (match, type) => `${type} Milk`
    },
    // "BREAD WHEAT" → "Wheat Bread"
    {
      pattern: /^BREAD\s+(WHEAT|WHITE|RYE|SOURDOUGH|MULTIGRAIN|WHOLE\s+GRAIN|ITALIAN|FRENCH)$/i,
      replacement: (match, type) => `${type} Bread`
    },
    // "CHEESE CHEDDAR" → "Cheddar Cheese"
    {
      pattern: /^CHEESE\s+(CHEDDAR|MOZZARELLA|SWISS|PROVOLONE|PARMESAN|AMERICAN|COLBY|MONTEREY|JACK)$/i,
      replacement: (match, type) => `${type} Cheese`
    },
    // "YOGURT GREEK" → "Greek Yogurt"
    {
      pattern: /^YOGURT\s+(GREEK|PLAIN|VANILLA|STRAWBERRY|BLUEBERRY|RASPBERRY|PEACH|MIXED\s+BERRY)$/i,
      replacement: (match, flavor) => `${flavor} Yogurt`
    },
    // "CHICKEN BREAST" → "Chicken Breast"
    {
      pattern: /^CHICKEN\s+(BREAST|THIGH|DRUMSTICK|WING|GROUND|WHOLE)$/i,
      replacement: (match, cut) => `Chicken ${cut}`
    },
    // "BEEF GROUND" → "Ground Beef"
    {
      pattern: /^BEEF\s+(GROUND|STEAK|ROAST|STEW|TENDERLOIN|SIRLOIN)$/i,
      replacement: (match, cut) => `${cut} Beef`
    },
    // "PORK CHOP" → "Pork Chops"
    {
      pattern: /^PORK\s+(CHOP|LOIN|ROAST|GROUND|BACON|SAUSAGE)$/i,
      replacement: (match, cut) => `Pork ${cut}`
    },
    // "FISH SALMON" → "Salmon"
    {
      pattern: /^FISH\s+(SALMON|TILAPIA|COD|TUNA|MAHI|SWORDFISH)$/i,
      replacement: (match, type) => type
    },
    // "RICE WHITE" → "White Rice"
    {
      pattern: /^RICE\s+(WHITE|BROWN|BASMATI|JASMINE|WILD|ARBORIO)$/i,
      replacement: (match, type) => `${type} Rice`
    },
    // "PASTA SPAGHETTI" → "Spaghetti"
    {
      pattern: /^PASTA\s+(SPAGHETTI|PENNE|FUSILLI|LINGUINE|FETTUCCINE|RIGATONI|MACARONI)$/i,
      replacement: (match, type) => type
    },
    // "OIL OLIVE" → "Olive Oil"
    {
      pattern: /^OIL\s+(OLIVE|VEGETABLE|CANOLA|COCONUT|AVOCADO|SESAME)$/i,
      replacement: (match, type) => `${type} Oil`
    },
    // "JUICE ORANGE" → "Orange Juice"
    {
      pattern: /^JUICE\s+(ORANGE|APPLE|GRAPE|CRANBERRY|PINEAPPLE|LEMON|LIME)$/i,
      replacement: (match, type) => `${type} Juice`
    },
    // "CEREAL CHEERIOS" → "Cheerios"
    {
      pattern: /^CEREAL\s+(CHEERIOS|FROSTED\s+FLAKES|RICE\s+KRISPIES|SPECIAL\s+K|RAISIN\s+BRAN)$/i,
      replacement: (match, brand) => brand
    }
  ];
  
  // Apply reordering patterns
  for (const { pattern, replacement } of reorderPatterns) {
    if (pattern.test(cleanedName)) {
      const newName = cleanedName.replace(pattern, replacement);
      console.log(`🔄 Reordered: "${cleanedName}" → "${newName}"`);
      cleanedName = newName;
      break;
    }
  }
  
  // Remove common abbreviations and clean up
  const abbreviationMappings = {
    'CT': 'Count',
    'PKG': 'Package',
    'PKT': 'Packet',
    'BTL': 'Bottle',
    'CAN': 'Can',
    'JAR': 'Jar',
    'BAG': 'Bag',
    'BOX': 'Box',
    'LB': 'Pound',
    'OZ': 'Ounce',
    'GAL': 'Gallon',
    'QT': 'Quart',
    'PT': 'Pint',
    'PK': 'Pack',
    'EA': 'Each',
    'PKT': 'Packet',
    'PKG': 'Package',
    'PCS': 'Pieces',
    'PKT': 'Packet',
    'BUN': 'Bunch',
    'BAG': 'Bag',
    'CUP': 'Cup',
    'TSP': 'Teaspoon',
    'TBSP': 'Tablespoon',
    'FL': 'Fluid',
    'ML': 'Milliliter',
    'L': 'Liter',
    'KG': 'Kilogram',
    'G': 'Gram',
    'MG': 'Milligram',
    'IN': 'Inch',
    'CM': 'Centimeter',
    'FT': 'Foot',
    'YD': 'Yard',
    'M': 'Meter',
    'MM': 'Millimeter'
  };
  
  // Replace abbreviations with full words
  for (const [abbr, full] of Object.entries(abbreviationMappings)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    if (regex.test(cleanedName)) {
      cleanedName = cleanedName.replace(regex, full);
      console.log(`📝 Replaced abbreviation "${abbr}" → "${full}"`);
    }
  }
  
  // Clean up extra spaces and normalize
  cleanedName = cleanedName
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase()); // Title case
  
  // Handle special cases
  if (cleanedName === 'Milk') cleanedName = 'Milk';
  if (cleanedName === 'Eggs') cleanedName = 'Eggs';
  if (cleanedName === 'Bread') cleanedName = 'Bread';
  if (cleanedName === 'Cheese') cleanedName = 'Cheese';
  
  console.log(`✨ FINAL CLEANED NAME: "${itemName}" → "${cleanedName}"`);
  return cleanedName;
};

const extractGroceryItem = (line) => {
  // Common grocery item keywords
  const groceryKeywords = [
    'milk', 'bread', 'eggs', 'banana', 'apple', 'orange', 'lettuce', 'tomato',
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'turkey', 'cheese', 'yogurt',
    'butter', 'cream', 'rice', 'pasta', 'flour', 'sugar', 'oil', 'juice',
    'soda', 'water', 'coffee', 'tea', 'beer', 'wine', 'chip', 'crack',
    'cookie', 'candy', 'popcorn', 'nut', 'frozen', 'pizza', 'ice cream',
    'onion', 'potato', 'carrot', 'cucumber', 'pepper', 'broccoli', 'spinach',
    'ham', 'bacon', 'sausage', 'steak', 'ground', 'sauce', 'soup', 'can',
    'bean', 'cereal', 'oat', 'drink', 'bottle', 'snack', 'bar', 'pretzel'
  ];

  const lowerLine = line.toLowerCase();
  
  for (const keyword of groceryKeywords) {
    if (lowerLine.includes(keyword)) {
      // Extract price if present
      const priceMatch = line.match(/([0-9]+\.[0-9]{2})/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : null;
      
      // Extract quantity if present
      const quantityMatch = line.match(/([0-9]+)\s*([A-Z]+)/i);
      const quantity = quantityMatch ? `${quantityMatch[1]} ${quantityMatch[2]}` : '1';
      
      // Clean the extracted name using the enhanced cleaning function
      const rawName = line.split(/\s+/).slice(0, 3).join(' ').trim(); // Take first 3 words as name
      const cleanedName = cleanReceiptItemName(rawName);
      
      return {
        name: cleanedName,
        quantity: quantity,
        price: price,
        category: categorizeItem(cleanedName),
        confidence: 'medium'
      };
    }
  }
  
  return null;
};

const categorizeItem = (itemName) => {
  const name = itemName.toLowerCase();
  
  // Produce
  if (name.includes('banana') || name.includes('apple') || name.includes('orange') || 
      name.includes('lettuce') || name.includes('tomato') || name.includes('carrot') ||
      name.includes('onion') || name.includes('potato') || name.includes('cucumber') ||
      name.includes('pepper') || name.includes('broccoli') || name.includes('spinach')) {
    return 'Produce';
  }
  
  // Dairy
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || 
      name.includes('egg') || name.includes('butter') || name.includes('cream') ||
      name.includes('sour cream') || name.includes('cottage cheese') || name.includes('half')) {
    return 'Dairy';
  }
  
  // Protein
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
      name.includes('fish') || name.includes('salmon') || name.includes('turkey') ||
      name.includes('ham') || name.includes('bacon') || name.includes('sausage') ||
      name.includes('steak') || name.includes('ground')) {
    return 'Protein';
  }
  
  // Grains & Breads
  if (name.includes('bread') || name.includes('rice') || name.includes('pasta') || 
      name.includes('cereal') || name.includes('oat') || name.includes('tortilla') ||
      name.includes('bagel') || name.includes('noodle')) {
    return 'Grains & Breads';
  }
  
  // Baking & Flours
  if (name.includes('flour') || name.includes('sugar') || name.includes('baking') ||
      name.includes('vanilla') || name.includes('chocolate') || name.includes('cocoa') ||
      name.includes('yeast') || name.includes('baking powder') || name.includes('baking soda')) {
    return 'Baking & Flours';
  }
  
  // Canned & Jarred Goods
  if (name.includes('soup') || name.includes('can') || name.includes('bean') ||
      name.includes('tomato') || name.includes('corn') || name.includes('peas') ||
      name.includes('tuna') || name.includes('sardine') || name.includes('pickle')) {
    return 'Canned & Jarred Goods';
  }
  
  // Oils, Vinegars & Fats
  if (name.includes('oil') || name.includes('vinegar') || name.includes('olive') ||
      name.includes('vegetable oil') || name.includes('sesame oil')) {
    return 'Oils, Vinegars & Fats';
  }
  
  // Condiments & Sauces
  if (name.includes('sauce') || name.includes('ketchup') || name.includes('mustard') ||
      name.includes('mayo') || name.includes('soy sauce') || name.includes('hot sauce') ||
      name.includes('bbq') || name.includes('ranch') || name.includes('dressing')) {
    return 'Condiments & Sauces';
  }
  
  // Spices & Seasonings
  if (name.includes('salt') || name.includes('pepper') || name.includes('spice') ||
      name.includes('herb') || name.includes('cumin') || name.includes('oregano') ||
      name.includes('basil') || name.includes('thyme') || name.includes('paprika')) {
    return 'Spices & Seasonings';
  }
  
  // Drinks & Beverages
  if (name.includes('juice') || name.includes('soda') || name.includes('water') || 
      name.includes('coffee') || name.includes('tea') || name.includes('beer') ||
      name.includes('wine') || name.includes('drink') || name.includes('bottle')) {
    return 'Drinks & Beverages';
  }
  
  // Snacks & Treats
  if (name.includes('chip') || name.includes('crack') || name.includes('cookie') || 
      name.includes('candy') || name.includes('popcorn') || name.includes('nut') ||
      name.includes('snack') || name.includes('bar') || name.includes('pretzel')) {
    return 'Snacks & Treats';
  }
  
  // Frozen
  if (name.includes('frozen') || name.includes('ice cream') || name.includes('pizza') ||
      name.includes('ice') || name.includes('frozen')) {
    return 'Frozen';
  }
  
  // Default to Other if no category matches
  return 'Other';
};

// Test API key validity with comprehensive debugging
export const testApiKey = async () => {
  try {
    console.log('🧪 OCR DEBUG - Testing Google Vision API key...');
    
    if (!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === 'paste_your_api_key_here') {
      console.log('❌ OCR DEBUG - No API key configured');
      return {
        valid: false,
        message: 'No API key configured. Using mock OCR for testing.',
        type: 'mock',
        debugInfo: {
          apiKeyExists: !!GOOGLE_VISION_API_KEY,
          apiKeyLength: GOOGLE_VISION_API_KEY ? GOOGLE_VISION_API_KEY.length : 0
        }
      };
    }

    console.log('🔑 OCR DEBUG - API key found, length:', GOOGLE_VISION_API_KEY.length);
    console.log('🔗 OCR DEBUG - Testing API endpoint:', GOOGLE_VISION_API_URL);

    // Test with a simple 1x1 pixel image (base64 encoded)
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const testBody = {
      requests: [{
        image: {
          content: testImage
        },
        features: [{
          type: 'TEXT_DETECTION',
          maxResults: 1,
        }],
      }],
    };

    console.log('📤 OCR DEBUG - Sending test request...');
    const startTime = Date.now();

    const testResponse = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBody),
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('📡 OCR DEBUG - Test response received:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      responseTime: `${responseTime}ms`
    });

    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('✅ OCR DEBUG - API test successful:', result);
      return {
        valid: true,
        message: 'Google Vision API is ready!',
        type: 'google',
        debugInfo: {
          responseTime: `${responseTime}ms`,
          responseStatus: testResponse.status,
          responseBody: result
        }
      };
    } else {
      const errorText = await testResponse.text();
      console.error('❌ OCR DEBUG - API test failed:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        errorText: errorText,
        responseTime: `${responseTime}ms`
      });
      
      if (testResponse.status === 403) {
        return {
          valid: false,
          message: 'API key is invalid or quota exceeded.',
          type: 'error',
          debugInfo: {
            responseTime: `${responseTime}ms`,
            responseStatus: testResponse.status,
            errorText: errorText
          }
        };
      } else {
        return {
          valid: false,
          message: `API test failed (${testResponse.status})`,
          type: 'error',
          debugInfo: {
            responseTime: `${responseTime}ms`,
            responseStatus: testResponse.status,
            errorText: errorText
          }
        };
      }
    }
  } catch (error) {
    console.error('💥 OCR DEBUG - API test error:', error);
    return {
      valid: false,
      message: 'Network error testing API key.',
      type: 'error',
      debugInfo: {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      }
    };
  }
};

// Get OCR status for user feedback
export const getOcrStatus = () => {
  if (!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === 'paste_your_api_key_here') {
    return {
      type: 'mock',
      message: 'Using mock OCR (demo mode)',
      description: 'Add your Google Vision API key for real OCR'
    };
  }
  return {
    type: 'google',
    message: 'Real OCR enabled (Google Vision API)',
    description: 'Using Google Vision API for accurate text extraction'
  };
};

// Mock OCR function for testing when API key is not available
export const mockExtractTextFromImage = async (imageUri) => {
  console.log('Using mock OCR for testing (no API key available)');
  
  // Simulate processing delay for realistic feel
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Return realistic mock receipt items
  const mockItems = [
    {
      name: 'Whole Milk',
      quantity: '1 gallon',
      price: 4.99,
      category: 'Dairy',
      confidence: 'high'
    },
    {
      name: 'Bread',
      quantity: '1 loaf',
      price: 2.99,
      category: 'Grains & Breads',
      confidence: 'high'
    },
    {
      name: 'Bananas',
      quantity: '1 bunch',
      price: 1.99,
      category: 'Produce',
      confidence: 'high'
    },
    {
      name: 'Eggs',
      quantity: '1 dozen',
      price: 3.49,
      category: 'Dairy',
      confidence: 'high'
    },
    {
      name: 'Chicken Breast',
      quantity: '2 lbs',
      price: 8.99,
      category: 'Protein',
      confidence: 'high'
    },
    {
      name: 'Orange Juice',
      quantity: '1/2 gallon',
      price: 3.99,
      category: 'Drinks & Beverages',
      confidence: 'medium'
    },
    {
      name: 'Crackers',
      quantity: '1 box',
      price: 2.49,
      category: 'Snacks & Treats',
      confidence: 'medium'
    }
  ];

  return {
    success: true,
    text: 'Mock receipt text extracted from image',
    items: mockItems,
    message: `Successfully extracted ${mockItems.length} items from your receipt! (Mock data - add API key for real OCR)`,
  };
}; 