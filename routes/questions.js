const express = require('express');
const router = express.Router();

// In-memory storage (replace with database)
let questions = [];

// Save question
router.post('/save', (req, res) => {
  try {
    const {
      questionText,
      options,
      correctAnswer,
      subject,
      chapter,
      difficulty,
      language,
      imageRef,
      explanation,
      tags
    } = req.body;

    // Validation
    if (!questionText || !options || options.length !== 4 || !correctAnswer) {
      return res.status(400).json({ 
        error: 'Invalid question format. Need: questionText, 4 options, correctAnswer' 
      });
    }

    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return res.status(400).json({ error: 'Correct answer must be A, B, C, or D' });
    }

    const question = {
      id: Date.now().toString(),
      questionText,
      options,
      correctAnswer,
      subject: subject || 'Biology',
      chapter: chapter || '',
      difficulty: difficulty || 'Medium',
      language: language || 'English',
      imageRef: imageRef || null,
      explanation: explanation || '',
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    questions.push(question);

    res.json({
      success: true,
      message: 'Question saved successfully',
      question
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all questions
router.get('/', (req, res) => {
  try {
    const { subject, difficulty, language } = req.query;
    
    let filtered = questions;

    if (subject) {
      filtered = filtered.filter(q => q.subject === subject);
    }
    if (difficulty) {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }
    if (language) {
      filtered = filtered.filter(q => q.language === language);
    }

    res.json({
      success: true,
      total: filtered.length,
      questions: filtered
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get question by ID
router.get('/:id', (req, res) => {
  try {
    const question = questions.find(q => q.id === req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      success: true,
      question
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update question
router.put('/:id', (req, res) => {
  try {
    const questionIndex = questions.findIndex(q => q.id === req.params.id);
    
    if (questionIndex === -1) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const updated = {
      ...questions[questionIndex],
      ...req.body,
      updatedAt: new Date()
    };

    questions[questionIndex] = updated;

    res.json({
      success: true,
      message: 'Question updated successfully',
      question: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete question
router.delete('/:id', (req, res) => {
  try {
    const initialLength = questions.length;
    questions = questions.filter(q => q.id !== req.params.id);
    
    if (questions.length === initialLength) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk save questions from OCR/PDF
router.post('/bulk-save', (req, res) => {
  try {
    const { questions: incomingQuestions } = req.body;

    if (!Array.isArray(incomingQuestions)) {
      return res.status(400).json({ error: 'Expected array of questions' });
    }

    const saved = [];
    const errors = [];

    for (let i = 0; i < incomingQuestions.length; i++) {
      const q = incomingQuestions[i];
      
      try {
        if (!q.questionText || !q.options || q.options.length !== 4 || !q.correctAnswer) {
          errors.push({ index: i, error: 'Invalid format' });
          continue;
        }

        const question = {
          id: Date.now().toString() + Math.random(),
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          subject: q.subject || 'Biology',
          chapter: q.chapter || '',
          difficulty: q.difficulty || 'Medium',
          language: q.language || 'English',
          imageRef: q.imageRef || null,
          explanation: q.explanation || '',
          tags: q.tags || [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        questions.push(question);
        saved.push(question);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    res.json({
      success: true,
      saved: saved.length,
      failed: errors.length,
      questions: saved,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
