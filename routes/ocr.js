const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type'));
    }
  }
});

// Preprocess image for better OCR
async function preprocessImage(buffer, language) {
  try {
    // Enhance image: grayscale, increase contrast, upscale
    const processedBuffer = await sharp(buffer)
      .grayscale()
      .normalize()
      .resize(2000, 2000, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .png()
      .toBuffer();
    
    return processedBuffer;
  } catch (error) {
    console.error('Image preprocessing error:', error);
    return buffer;
  }
}

// Extract text with OCR
async function extractTextWithOCR(imageBuffer, language = 'eng') {
  try {
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      language,
      {
        logger: m => console.log('OCR Progress:', m)
      }
    );
    return text;
  } catch (error) {
    throw new Error('OCR processing failed: ' + error.message);
  }
}

// Parse extracted text to identify question structure
function parseQuestionStructure(text) {
  const lines = text.split('\n').filter(line => line.trim());
  
  const parsed = {
    questionText: '',
    options: [],
    correctAnswer: null,
    hasImage: false,
    confidence: 0
  };

  let inOptions = false;
  let optionBuffer = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;

    // Detect answer (usually marked with A), B), C), D), or (A), (B), (C), (D))
    const answerMatch = line.match(/^(?:Answer|Ans\.?|Correct Answer)[\s:]*([A-D])/i);
    if (answerMatch) {
      parsed.correctAnswer = answerMatch[1].toUpperCase();
      continue;
    }

    // Detect options
    const optionMatch = line.match(/^([A-D][\)\.])\s*(.+)$/);
    if (optionMatch) {
      inOptions = true;
      if (optionBuffer) {
        parsed.options.push(optionBuffer.trim());
      }
      optionBuffer = optionMatch[2];
    } else if (inOptions && line.match(/^[A-D][\)\.]/) === null) {
      // Continue building current option
      optionBuffer += ' ' + line;
    } else if (!inOptions && !line.match(/^[A-D]/)) {
      // This is part of question text
      parsed.questionText += ' ' + line;
    }
  }

  // Push last option
  if (optionBuffer) {
    parsed.options.push(optionBuffer.trim());
  }

  // Clean question text
  parsed.questionText = parsed.questionText.trim();
  
  // Calculate confidence score based on structure
  let confidenceScore = 0;
  if (parsed.questionText.length > 10) confidenceScore += 25;
  if (parsed.options.length === 4) confidenceScore += 50;
  if (parsed.correctAnswer) confidenceScore += 25;
  
  parsed.confidence = confidenceScore;

  return parsed;
}

// OCR Upload and Extract
router.post('/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const language = req.body.language || 'eng';
    const languageMap = {
      'english': 'eng',
      'hindi': 'hin',
      'eng': 'eng',
      'hin': 'hin'
    };

    const tessLanguage = languageMap[language.toLowerCase()] || 'eng';

    // Preprocess image
    const preprocessed = await preprocessImage(req.file.buffer, tessLanguage);

    // Extract text
    const extractedText = await extractTextWithOCR(preprocessed, tessLanguage);

    // Parse structure
    const parsed = parseQuestionStructure(extractedText);

    // Save original image for reference
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imageName = `${Date.now()}-original.png`;
    const imagePath = path.join(uploadsDir, imageName);
    fs.writeFileSync(imagePath, req.file.buffer);

    res.json({
      success: true,
      extracted: parsed,
      rawText: extractedText,
      imageRef: imageName,
      language: tessLanguage
    });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch OCR for multiple images
router.post('/extract-batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const language = req.body.language || 'eng';
    const languageMap = {
      'english': 'eng',
      'hindi': 'hin',
      'eng': 'eng',
      'hin': 'hin'
    };

    const tessLanguage = languageMap[language.toLowerCase()] || 'eng';

    const results = [];

    for (const file of req.files) {
      try {
        // Preprocess image
        const preprocessed = await preprocessImage(file.buffer, tessLanguage);

        // Extract text
        const extractedText = await extractTextWithOCR(preprocessed, tessLanguage);

        // Parse structure
        const parsed = parseQuestionStructure(extractedText);

        // Save original image
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const imageName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
        const imagePath = path.join(uploadsDir, imageName);
        fs.writeFileSync(imagePath, file.buffer);

        results.push({
          filename: file.originalname,
          success: true,
          extracted: parsed,
          imageRef: imageName
        });
      } catch (error) {
        results.push({
          filename: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
