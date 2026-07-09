const express = require('express');
const multer = require('multer');
const pdfjs = require('pdfjs-dist');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
});

// Convert PDF page to image
async function pdfPageToImage(pdfBuffer, pageNumber) {
  try {
    const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;
    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({ scale: 2 });
    const canvas = require('canvas').createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    return canvas.toBuffer('image/png');
  } catch (error) {
    // Fallback: Use a simple PDF to image conversion
    console.warn('Canvas rendering not available, using buffer method');
    throw error;
  }
}

// Preprocess image for better OCR
async function preprocessImage(buffer) {
  try {
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
      language
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
    confidence: 0
  };

  let inOptions = false;
  let optionBuffer = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;

    const answerMatch = line.match(/^(?:Answer|Ans\.?|Correct Answer)[\s:]*([A-D])/i);
    if (answerMatch) {
      parsed.correctAnswer = answerMatch[1].toUpperCase();
      continue;
    }

    const optionMatch = line.match(/^([A-D][\)\.])\s*(.+)$/);
    if (optionMatch) {
      inOptions = true;
      if (optionBuffer) {
        parsed.options.push(optionBuffer.trim());
      }
      optionBuffer = optionMatch[2];
    } else if (inOptions && line.match(/^[A-D][\)\.]/) === null) {
      optionBuffer += ' ' + line;
    } else if (!inOptions && !line.match(/^[A-D]/)) {
      parsed.questionText += ' ' + line;
    }
  }

  if (optionBuffer) {
    parsed.options.push(optionBuffer.trim());
  }

  parsed.questionText = parsed.questionText.trim();
  
  let confidenceScore = 0;
  if (parsed.questionText.length > 10) confidenceScore += 25;
  if (parsed.options.length === 4) confidenceScore += 50;
  if (parsed.correctAnswer) confidenceScore += 25;
  
  parsed.confidence = confidenceScore;

  return parsed;
}

// PDF Upload and Extract
router.post('/extract', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    const language = req.body.language || 'eng';
    const languageMap = {
      'english': 'eng',
      'hindi': 'hin',
      'eng': 'eng',
      'hin': 'hin'
    };

    const tessLanguage = languageMap[language.toLowerCase()] || 'eng';

    const pdf = await pdfjs.getDocument({ data: req.file.buffer }).promise;
    const totalPages = pdf.numPages;
    const questions = [];

    // Extract from each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        
        // Try text extraction first
        const textContent = await page.getTextContent();
        let pageText = textContent.items.map(item => item.str).join(' ');

        // If text extraction is minimal, try OCR on rendered image
        if (pageText.trim().length < 50) {
          try {
            // Render page as image
            const viewport = page.getViewport({ scale: 2 });
            const canvas = require('canvas').createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;

            const imageBuffer = canvas.toBuffer('image/png');
            const preprocessed = await preprocessImage(imageBuffer);
            pageText = await extractTextWithOCR(preprocessed, tessLanguage);
          } catch (ocrError) {
            console.log(`Skipping OCR for page ${pageNum}:`, ocrError.message);
          }
        }

        // Parse question
        if (pageText.trim().length > 20) {
          const parsed = parseQuestionStructure(pageText);
          questions.push({
            pageNumber: pageNum,
            ...parsed,
            rawText: pageText
          });
        }
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
      }
    }

    res.json({
      success: true,
      totalPages,
      questionsExtracted: questions.length,
      questions
    });
  } catch (error) {
    console.error('PDF Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
