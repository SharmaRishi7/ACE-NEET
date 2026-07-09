# ACE-NEET Question Upload System

A comprehensive web application for uploading NEET biology questions with OCR (Optical Character Recognition) support, PDF processing, and multi-language capabilities.

## Features

### 📷 Image Upload with OCR
- Upload question images (JPEG, PNG, WebP)
- Automatic text extraction using Tesseract.js
- Supports both English and Hindi text
- Smart image preprocessing for better accuracy
- Editable extracted content before saving
- Confidence scoring for extraction accuracy

### 📄 PDF Processing
- Upload PDF files with multiple questions
- Extract text from each page
- Automatic question parsing
- Support for both scanned and text-based PDFs
- Batch processing of multiple questions

### ✍️ Manual Entry
- Direct question entry with visual form
- Support for 4 multiple choice options
- Subject categorization (Biology, Chemistry, Physics)
- Difficulty levels (Easy, Medium, Hard)
- Chapter/topic organization
- Optional explanations

### 🏆 Question Library
- Searchable question database
- Filter by subject, difficulty, and language
- Edit and delete questions
- View all questions with formatting
- Organize by chapters and topics

### 🌍 Multi-Language Support
- English text recognition
- Hindi (हिन्दी) text recognition
- Easy language switching
- Support for mixed language content

### 🖼️ Advanced Features
- Biology diagram support
- Image preview before processing
- Batch upload capability (up to 10 images at once)
- Confidence indicators
- Editable OCR results
- Question history and management

## Tech Stack

### Backend
- **Node.js & Express** - Server framework
- **Tesseract.js** - OCR engine
- **PDF.js** - PDF processing
- **Sharp** - Image optimization
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern features
- **Vanilla JavaScript** - No framework dependencies
- **Responsive Design** - Works on all devices

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SharmaRishi7/ACE-NEET.git
   cd ACE-NEET
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open your browser and go to `http://localhost:5000`

## Usage

### Uploading Questions from Images

1. Go to the **Image Upload** tab
2. Upload a question image (drag & drop or click)
3. Select the language (English/Hindi)
4. Click "Extract Text"
5. Review the extracted content
6. Edit any incorrect fields
7. Click "Save Question"

### Uploading Questions from PDF

1. Go to the **PDF Upload** tab
2. Upload a PDF file
3. Select the language
4. Click "Extract Questions"
5. Review each extracted question
6. Edit and save individual questions
7. Or select multiple to bulk save

### Manual Question Entry

1. Go to the **Manual Entry** tab
2. Fill in the question text
3. Enter all 4 options (A, B, C, D)
4. Select the correct answer
5. Add subject, chapter, and difficulty
6. Optionally add an explanation
7. Click "Save Question"

### Managing Your Question Library

1. Go to the **Question Library** tab
2. Search for specific questions
3. Filter by subject, difficulty, or language
4. Click "Edit" to modify any question
5. Click "Delete" to remove a question
6. All changes are instant

## API Endpoints

### OCR Routes (`/api/ocr`)
- `POST /extract` - Extract text from single image
- `POST /extract-batch` - Extract text from multiple images (up to 10)

**Request:**
```json
{
  "image": "file",
  "language": "english|hindi"
}
```

**Response:**
```json
{
  "success": true,
  "extracted": {
    "questionText": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "confidence": 85
  },
  "imageRef": "filename"
}
```

### PDF Routes (`/api/pdf`)
- `POST /extract` - Extract questions from PDF

**Request:**
```json
{
  "pdf": "file",
  "language": "english|hindi"
}
```

**Response:**
```json
{
  "success": true,
  "totalPages": 5,
  "questionsExtracted": 10,
  "questions": [...]
}
```

### Question Routes (`/api/questions`)
- `POST /save` - Save a single question
- `POST /bulk-save` - Save multiple questions
- `GET /` - Get all questions (with filters)
- `GET /:id` - Get specific question
- `PUT /:id` - Update question
- `DELETE /:id` - Delete question

**Save Request:**
```json
{
  "questionText": "string",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "subject": "Biology|Chemistry|Physics",
  "chapter": "string",
  "difficulty": "Easy|Medium|Hard",
  "language": "English|Hindi",
  "explanation": "string"
}
```

## OCR Accuracy Tips

### For Best Results:
1. **Image Quality**: Use high-quality, well-lit images
2. **Resolution**: Minimum 200 DPI recommended
3. **Angle**: Keep images straight and horizontal
4. **Contrast**: Ensure good contrast between text and background
5. **Cleanliness**: Remove shadows and watermarks if possible

### Supported Formats:
- **Images**: JPEG, PNG, WebP
- **PDFs**: Text-based and scanned PDFs
- **Languages**: English (eng), Hindi (hin)

## Troubleshooting

### OCR Not Extracting Text Correctly
- Try improving image quality/contrast
- Ensure text is clearly visible
- Check that the language is set correctly
- Use the "Edit & Save" option to manually correct

### PDF Extraction Issues
- Verify PDF is not password protected
- Check file size (max 50MB)
- Scanned PDFs may require more processing time
- Test with a smaller portion first

### Server Won't Start
- Ensure port 5000 is available
- Check Node.js version (v14+)
- Verify all dependencies installed: `npm install`
- Check for errors: `npm run dev`

## Project Structure

```
ACE-NEET/
├── public/
│   ├── index.html         # Main UI
│   ├── styles.css         # Styling
│   ├── app.js            # Frontend logic
│   └── uploads/          # Uploaded files
├── routes/
│   ├── ocr.js            # OCR endpoints
│   ├── pdf.js            # PDF endpoints
│   └── questions.js      # Question management
├── server.js             # Express server
├── package.json          # Dependencies
├── .env.example          # Environment template
└── README.md             # This file
```

## Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication and admin panel
- [ ] Advanced image filters
- [ ] Video question support
- [ ] Question tagging system
- [ ] Analytics dashboard
- [ ] Export to various formats (PDF, Excel)
- [ ] Question bank management
- [ ] Performance metrics
- [ ] Mobile app version

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Author

**Sharma Rishi** - [GitHub Profile](https://github.com/SharmaRishi7)

---

**Happy studying! 📚**
