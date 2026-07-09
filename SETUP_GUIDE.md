# ACE-NEET Question Upload System - Setup Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- Git (optional)

### Installation Steps

#### 1. Clone or Download Repository
```bash
git clone https://github.com/SharmaRishi7/ACE-NEET.git
cd ACE-NEET
```

#### 2. Install Dependencies
```bash
npm install
```

This will install all required packages:
- Express (web server)
- Tesseract.js (OCR engine)
- PDF.js (PDF processing)
- Sharp (image optimization)
- Multer (file uploads)
- CORS (cross-origin requests)

#### 3. Setup Environment
```bash
cp .env.example .env
```

You can leave the `.env` file as-is for development. The default PORT is 5000.

#### 4. Start the Server
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start at `http://localhost:5000`

#### 5. Access the Application
Open your browser and go to:
```
http://localhost:5000
```

---

## 📋 Feature Overview

### 1. **Image Upload with OCR**
- Upload JPEG, PNG, or WebP images
- Automatic text extraction using Tesseract.js
- Supports English and Hindi
- Shows confidence score for extraction accuracy
- Edit extracted content before saving

**Steps:**
1. Click "Image Upload" tab
2. Drag & drop or click to select an image
3. Choose language (English/Hindi)
4. Click "Extract Text"
5. Review extracted question and options
6. Click "Edit & Save" to save or make corrections

### 2. **PDF Processing**
- Upload PDF files with multiple questions
- Automatic page-by-page extraction
- Text-based and scanned PDF support
- Batch extraction of all questions

**Steps:**
1. Click "PDF Upload" tab
2. Upload a PDF file
3. Choose language
4. Click "Extract Questions"
5. Review each extracted question
6. Edit and save individual questions

### 3. **Manual Entry**
- Direct question entry with form
- Support for all fields (options, answer, metadata)
- Subject, chapter, and difficulty selection

**Steps:**
1. Click "Manual Entry" tab
2. Fill in question text and options
3. Select correct answer
4. Add subject, difficulty, and chapter
5. Optionally add explanation
6. Click "Save Question"

### 4. **Question Library**
- View all saved questions
- Search by keywords
- Filter by subject and difficulty
- Edit or delete questions

---

## 🔧 Troubleshooting

### Issue: Server won't start
**Solutions:**
- Check if port 5000 is already in use
- Try a different port: `PORT=3000 npm start`
- Ensure Node.js is properly installed: `node --version`

### Issue: OCR extraction is poor
**Solutions:**
- Use high-quality, well-lit images (minimum 200 DPI recommended)
- Ensure images are straight (not tilted)
- Remove shadows and watermarks
- Try the "Edit & Save" option to manually correct

### Issue: PDF extraction not working
**Solutions:**
- Verify PDF is not password protected
- Check file size (max 50MB)
- For scanned PDFs, extraction takes longer
- Test with a simpler PDF first

### Issue: "Cannot find module" error
**Solution:**
```bash
rm -rf node_modules
npm install
```

### Issue: CORS errors
**Solution:**
Make sure you're accessing from `http://localhost:5000` and not a different port.

---

## 📁 Project Structure

```
ACE-NEET/
├── public/
│   ├── index.html          # Main UI page
│   ├── styles.css          # Styling
│   ├── app.js             # Frontend JavaScript
│   └── uploads/           # Uploaded files (auto-created)
├── routes/
│   ├── ocr.js             # OCR endpoint (/api/ocr)
│   ├── pdf.js             # PDF endpoint (/api/pdf)
│   └── questions.js       # Question management (/api/questions)
├── server.js              # Express server
├── package.json           # Dependencies
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
└── README.md             # Full documentation
```

---

## 🌐 API Endpoints

### OCR Routes
**POST /api/ocr/extract**
- Upload single image
- Extract text with OCR
- Returns: Extracted question structure, confidence score

**POST /api/ocr/extract-batch**
- Upload multiple images (up to 10)
- Batch process OCR
- Returns: Array of extracted questions

### PDF Routes
**POST /api/pdf/extract**
- Upload PDF file
- Extract questions from all pages
- Returns: Array of questions per page

### Question Routes
**POST /api/questions/save**
- Save single question
- Returns: Saved question with ID

**POST /api/questions/bulk-save**
- Save multiple questions at once
- Returns: Confirmation with count

**GET /api/questions**
- Retrieve all questions
- Optional filters: ?subject=Biology&difficulty=Hard&language=English
- Returns: List of questions

**GET /api/questions/:id**
- Get specific question by ID
- Returns: Question details

**PUT /api/questions/:id**
- Update existing question
- Returns: Updated question

**DELETE /api/questions/:id**
- Delete question
- Returns: Confirmation

---

## 🎯 Best Practices for OCR Accuracy

### Image Quality
- ✅ DO: Use high-resolution images (1200+ pixels)
- ✅ DO: Ensure good lighting
- ✅ DO: Keep images straight and horizontal
- ❌ DON'T: Use blurry or pixelated images
- ❌ DON'T: Tilt or angle the image

### For Biology Diagrams
- Upload clear, high-contrast diagrams
- Diagrams with minimal text work best
- Use "Edit & Save" to add missing text
- Consider separating text and diagram

### Language-Specific Tips
**English:**
- Standard fonts work best
- Cursive fonts may have lower accuracy
- Mixed English + Hindi content supported

**Hindi:**
- Use clear Devanagari font
- Ensure proper diacritics (marks)
- Test with simple text first

---

## 🔐 Security Notes

### Development
- The current implementation uses in-memory storage
- Data resets when server restarts
- Not suitable for production

### For Production
1. **Add Database:**
   - MongoDB or PostgreSQL recommended
   - See MongoDB setup in commented code

2. **Add Authentication:**
   - Implement admin login
   - Protect question management endpoints

3. **Add File Validation:**
   - Implement file type validation
   - Add virus scanning for uploads

4. **HTTPS:**
   - Use SSL/TLS certificates
   - Set secure CORS policies

---

## 📚 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Server** | Node.js + Express | Backend framework |
| **OCR** | Tesseract.js | Text extraction from images |
| **PDF Processing** | PDF.js | PDF reading and text extraction |
| **Image Processing** | Sharp | Image optimization and preprocessing |
| **File Upload** | Multer | Handle multipart form data |
| **Frontend** | Vanilla JS + HTML5 + CSS3 | User interface |
| **API** | REST | Communication protocol |

---

## 📖 Usage Examples

### Using cURL to Extract from Image
```bash
curl -X POST http://localhost:5000/api/ocr/extract \
  -F "image=@question.jpg" \
  -F "language=english"
```

### Using cURL to Save Question
```bash
curl -X POST http://localhost:5000/api/questions/save \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "What is photosynthesis?",
    "options": ["Process 1", "Process 2", "Process 3", "Process 4"],
    "correctAnswer": "A",
    "subject": "Biology",
    "difficulty": "Medium"
  }'
```

---

## 🤝 Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 💡 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication and admin dashboard
- [ ] Advanced image filters and preprocessing
- [ ] Video question support
- [ ] Question tagging and categorization
- [ ] Analytics and statistics dashboard
- [ ] Export to PDF/Excel
- [ ] Mobile app version
- [ ] Batch import from existing question banks
- [ ] Performance metrics and confidence scoring

---

## 🆘 Getting Help

**Issues or Questions?**
1. Check the troubleshooting section above
2. Review the README.md for detailed documentation
3. Check console logs for error messages
4. Open an issue on GitHub

**Console Debugging:**
- Open browser Developer Tools (F12)
- Check Network tab for API responses
- Check Console tab for JavaScript errors
- Check Server logs in terminal

---

## 🎉 You're All Set!

Your ACE-NEET Question Upload System is ready to use. Start uploading questions and building your question bank today!

**Happy studying! 📚**
