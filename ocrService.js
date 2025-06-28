import * as FileSystem from 'expo-file-system';
import { GOOGLE_VISION_API_KEY } from '@env';

const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Real OCR extraction using Google Vision API
export const extractTextFromImage = async (imageUri) => {
  try {
    console.log('Starting Google Vision API OCR extraction for image:', imageUri);
    
    // Check if API key is available
    if (!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === 'paste_your_api_key_here') {
      console.log('No valid Google Vision API key found, using mock OCR');
      return await mockExtractTextFromImage(imageUri);
    }
    
    // Use Google Vision API for real OCR
    console.log('Using Google Vision API for real OCR...');
    const googleResult = await extractTextWithGoogleVision(imageUri);
    
    if (googleResult.success && googleResult.text) {
      console.log('Google Vision API successful, parsing text...');
      return parseReceiptText(googleResult.text);
    }
    
    // If Google Vision fails, return error
    return {
      success: false,
      text: '',
      items: [],
      message: 'Could not extract text from the receipt. Please try a clearer image.',
    };

  } catch (error) {
    console.error('Google Vision OCR extraction error:', error);
    
    // Handle specific error types
    if (error.message.includes('API key') || error.message.includes('403')) {
      return {
        success: false,
        text: '',
        items: [],
        message: 'API key is invalid or quota exceeded. Please check your Google Vision API setup.',
      };
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        success: false,
        text: '',
        items: [],
        message: 'Network error. Please check your internet connection and try again.',
      };
    }
    
    if (error.message.includes('timeout')) {
      return {
        success: false,
        text: '',
        items: [],
        items: [],
        message: 'Request timed out. Please try again.',
      };
    }
    
    return {
      success: false,
      text: '',
      items: [],
      message: `OCR processing failed: ${error.message}. Please try again.`,
    };
  }
};

// Google Vision API OCR with comprehensive error handling
const extractTextWithGoogleVision = async (imageUri) => {
  console.log('Reading image for Google Vision API...');
  
  try {
    // Read the image file and convert to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
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

    console.log('Sending request to Google Vision API...');

    // Make the API request with timeout and comprehensive error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle different HTTP status codes
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vision API error:', response.status, errorText);
      
      switch (response.status) {
        case 400:
          throw new Error('Invalid image format. Please try a clearer photo.');
        case 401:
          throw new Error('API key is invalid. Please check your Google Vision API setup.');
        case 403:
          throw new Error('API key is invalid or quota exceeded. Please check your Google Vision API setup.');
        case 429:
          throw new Error('API rate limit exceeded. Please try again in a moment.');
        case 500:
          throw new Error('Google Vision API server error. Please try again later.');
        case 503:
          throw new Error('Google Vision API is temporarily unavailable. Please try again later.');
        default:
          throw new Error(`API error (${response.status}): ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('Google Vision API response received successfully');

    // Check for API errors in the response body
    if (result.error) {
      throw new Error(`Google Vision API error: ${result.error.message}`);
    }

    const textAnnotations = result.responses[0]?.textAnnotations;
    
    if (!textAnnotations || textAnnotations.length === 0) {
      console.log('No text detected in image by Google Vision API');
      return {
        success: false,
        text: '',
        message: 'No text detected in the receipt. Please try again with a clearer image.',
      };
    }

    // The first annotation contains the full text
    const fullText = textAnnotations[0].description;
    console.log('Extracted text from Google Vision API:', fullText);

    return {
      success: true,
      text: fullText,
      message: 'Successfully extracted text with Google Vision API'
    };

  } catch (error) {
    console.error('Google Vision API error:', error);
    
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
        const cleanName = name.trim();
        
        // Skip if name is too short or contains only numbers
        if (cleanName.length < 2 || /^\d+$/.test(cleanName)) {
          continue;
        }
        
        console.log('Matched item:', { name: cleanName, quantity, price });
        
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
      
      return {
        name: line.split(/\s+/).slice(0, 3).join(' ').trim(), // Take first 3 words as name
        quantity: quantity,
        price: price,
        category: categorizeItem(keyword),
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
  
  // Dairy & Eggs
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || 
      name.includes('egg') || name.includes('butter') || name.includes('cream') ||
      name.includes('sour cream') || name.includes('cottage cheese') || name.includes('half')) {
    return 'Dairy & Eggs';
  }
  
  // Meat & Seafood
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
      name.includes('fish') || name.includes('salmon') || name.includes('turkey') ||
      name.includes('ham') || name.includes('bacon') || name.includes('sausage') ||
      name.includes('steak') || name.includes('ground')) {
    return 'Meat & Seafood';
  }
  
  // Pantry Staples
  if (name.includes('bread') || name.includes('rice') || name.includes('pasta') || 
      name.includes('flour') || name.includes('sugar') || name.includes('oil') ||
      name.includes('sauce') || name.includes('soup') || name.includes('can') ||
      name.includes('bean') || name.includes('cereal') || name.includes('oat')) {
    return 'Pantry Staples';
  }
  
  // Beverages
  if (name.includes('juice') || name.includes('soda') || name.includes('water') || 
      name.includes('coffee') || name.includes('tea') || name.includes('beer') ||
      name.includes('wine') || name.includes('drink') || name.includes('bottle')) {
    return 'Beverages';
  }
  
  // Snacks
  if (name.includes('chip') || name.includes('crack') || name.includes('cookie') || 
      name.includes('candy') || name.includes('popcorn') || name.includes('nut') ||
      name.includes('snack') || name.includes('bar') || name.includes('pretzel')) {
    return 'Snacks';
  }
  
  // Frozen
  if (name.includes('frozen') || name.includes('ice cream') || name.includes('pizza') ||
      name.includes('ice') || name.includes('frozen')) {
    return 'Frozen';
  }
  
  // Default to Other if no category matches
  return 'Other';
};

// Test API key validity
export const testApiKey = async () => {
  try {
    if (!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === 'paste_your_api_key_here') {
      return {
        valid: false,
        message: 'No API key configured. Using mock OCR for testing.',
        type: 'mock'
      };
    }

    // Test with a simple request
    const testResponse = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 pixel
          },
          features: [{
            type: 'TEXT_DETECTION',
            maxResults: 1,
          }],
        }],
      }),
    });

    if (testResponse.ok) {
      return {
        valid: true,
        message: 'Google Vision API is ready!',
        type: 'google'
      };
    } else if (testResponse.status === 403) {
      return {
        valid: false,
        message: 'API key is invalid or quota exceeded.',
        type: 'error'
      };
    } else {
      return {
        valid: false,
        message: `API test failed (${testResponse.status})`,
        type: 'error'
      };
    }
  } catch (error) {
    return {
      valid: false,
      message: 'Network error testing API key.',
      type: 'error'
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
      category: 'Dairy & Eggs',
      confidence: 'high'
    },
    {
      name: 'Bread',
      quantity: '1 loaf',
      price: 2.99,
      category: 'Pantry Staples',
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
      category: 'Dairy & Eggs',
      confidence: 'high'
    },
    {
      name: 'Chicken Breast',
      quantity: '2 lbs',
      price: 8.99,
      category: 'Meat & Seafood',
      confidence: 'high'
    },
    {
      name: 'Orange Juice',
      quantity: '1/2 gallon',
      price: 3.99,
      category: 'Beverages',
      confidence: 'medium'
    },
    {
      name: 'Crackers',
      quantity: '1 box',
      price: 2.49,
      category: 'Snacks',
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