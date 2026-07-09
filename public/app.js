// Global state
let currentEditingData = null;
let allQuestions = [];

const API_BASE = 'http://localhost:5000/api';

// ==================== Utility Functions ====================

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠'}</span>
        <span>${message}</span>
    `;
    
    const container = document.querySelector('main');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 5000);
}

function showLoading(show = true, text = 'Processing...') {
    const spinner = document.getElementById('loadingSpinner');
    const loadingText = document.getElementById('loadingText');
    
    if (show) {
        loadingText.textContent = text;
        spinner.style.display = 'flex';
    } else {
        spinner.style.display = 'none';
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// ==================== Tab Navigation ====================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        switchTab(this.dataset.tab);
    });
});

// ==================== Image Upload ====================

const imageUploadArea = document.getElementById('imageUploadArea');
const imageInput = document.getElementById('imageInput');
const extractImageBtn = document.getElementById('extractImageBtn');

imageUploadArea.addEventListener('click', () => imageInput.click());

imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.style.background = 'rgba(99, 102, 241, 0.2)';
});

imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.style.background = 'var(--gray-light)';
});

imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.style.background = 'var(--gray-light)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        imageInput.files = files;
        handleImageSelected(files[0]);
    }
});

imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageSelected(e.target.files[0]);
    }
});

function handleImageSelected(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        extractImageBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

extractImageBtn.addEventListener('click', async () => {
    if (!imageInput.files.length) {
        showAlert('Please select an image first', 'error');
        return;
    }

    const language = document.getElementById('imageLang').value;
    const formData = new FormData();
    formData.append('image', imageInput.files[0]);
    formData.append('language', language);

    showLoading(true, 'Extracting text from image...');

    try {
        const response = await fetch(`${API_BASE}/ocr/extract`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'OCR extraction failed');
        }

        showLoading(false);
        displayExtractedImage(data);
    } catch (error) {
        showLoading(false);
        showAlert(error.message, 'error');
    }
});

function displayExtractedImage(data) {
    const container = document.getElementById('imageExtractedContent');
    const extracted = data.extracted;

    let html = `
        <div class="extracted-item">
            <h4>Extracted Question</h4>
            <p><strong>Question:</strong><br>${escapeHtml(extracted.questionText)}</p>
            
            <p><strong>Options:</strong></p>
            <ul>
                <li><strong>A)</strong> ${escapeHtml(extracted.options[0] || 'Not found')}</li>
                <li><strong>B)</strong> ${escapeHtml(extracted.options[1] || 'Not found')}</li>
                <li><strong>C)</strong> ${escapeHtml(extracted.options[2] || 'Not found')}</li>
                <li><strong>D)</strong> ${escapeHtml(extracted.options[3] || 'Not found')}</li>
            </ul>
            
            <p><strong>Correct Answer:</strong> ${extracted.correctAnswer || 'Not found'}</p>
            
            <span class="confidence-badge confidence-${getConfidenceLevel(extracted.confidence)}">
                Confidence: ${extracted.confidence}%
            </span>
            
            <div class="item-actions">
                <button class="btn btn-primary" onclick="openEditModal(${JSON.stringify(extracted).replace(/"/g, '&quot;')}, '${data.imageRef}')">
                    Edit & Save
                </button>
                <button class="btn btn-secondary" onclick="document.getElementById('imageExtracted').style.display = 'none';">
                    Discard
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
    document.getElementById('imageExtracted').style.display = 'block';
}

function getConfidenceLevel(confidence) {
    if (confidence >= 75) return 'high';
    if (confidence >= 50) return 'medium';
    return 'low';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== PDF Upload ====================

const pdfUploadArea = document.getElementById('pdfUploadArea');
const pdfInput = document.getElementById('pdfInput');
const extractPdfBtn = document.getElementById('extractPdfBtn');

pdfUploadArea.addEventListener('click', () => pdfInput.click());

pdfUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    pdfUploadArea.style.background = 'rgba(99, 102, 241, 0.2)';
});

pdfUploadArea.addEventListener('dragleave', () => {
    pdfUploadArea.style.background = 'var(--gray-light)';
});

pdfUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    pdfUploadArea.style.background = 'var(--gray-light)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        pdfInput.files = files;
        extractPdfBtn.style.display = 'block';
    } else {
        showAlert('Please drop a PDF file', 'error');
    }
});

pdfInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        extractPdfBtn.style.display = 'block';
    }
});

extractPdfBtn.addEventListener('click', async () => {
    if (!pdfInput.files.length) {
        showAlert('Please select a PDF first', 'error');
        return;
    }

    const language = document.getElementById('pdfLang').value;
    const formData = new FormData();
    formData.append('pdf', pdfInput.files[0]);
    formData.append('language', language);

    showLoading(true, 'Extracting questions from PDF...');

    try {
        const response = await fetch(`${API_BASE}/pdf/extract`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'PDF extraction failed');
        }

        showLoading(false);
        displayExtractedPdf(data);
    } catch (error) {
        showLoading(false);
        showAlert(error.message, 'error');
    }
});

function displayExtractedPdf(data) {
    const container = document.getElementById('pdfExtractedContent');
    
    let html = `<p>Extracted ${data.questionsExtracted} questions from ${data.totalPages} pages</p>`;
    
    data.questions.forEach((q, index) => {
        html += `
            <div class="extracted-item">
                <h4>Question ${index + 1} (Page ${q.pageNumber})</h4>
                <p><strong>Question:</strong><br>${escapeHtml(q.questionText)}</p>
                
                <p><strong>Options:</strong></p>
                <ul>
                    <li><strong>A)</strong> ${escapeHtml(q.options[0] || 'Not found')}</li>
                    <li><strong>B)</strong> ${escapeHtml(q.options[1] || 'Not found')}</li>
                    <li><strong>C)</strong> ${escapeHtml(q.options[2] || 'Not found')}</li>
                    <li><strong>D)</strong> ${escapeHtml(q.options[3] || 'Not found')}</li>
                </ul>
                
                <p><strong>Correct Answer:</strong> ${q.correctAnswer || 'Not found'}</p>
                
                <span class="confidence-badge confidence-${getConfidenceLevel(q.confidence)}">
                    Confidence: ${q.confidence}%
                </span>
                
                <div class="item-actions">
                    <button class="btn btn-primary" onclick="openEditModal(${JSON.stringify(q).replace(/"/g, '&quot;')})">
                        Edit & Save
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('pdfExtracted').style.display = 'block';
}

// ==================== Modal Management ====================

const modal = document.getElementById('editModal');
const closeBtn = document.querySelector('.close');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editForm = document.getElementById('editForm');

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

cancelEditBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

window.openEditModal = function(question, imageRef = null) {
    currentEditingData = { question, imageRef };
    
    document.getElementById('editQuestion').value = question.questionText || '';
    document.getElementById('editOptionA').value = question.options[0] || '';
    document.getElementById('editOptionB').value = question.options[1] || '';
    document.getElementById('editOptionC').value = question.options[2] || '';
    document.getElementById('editOptionD').value = question.options[3] || '';
    document.getElementById('editCorrectAnswer').value = question.correctAnswer || 'A';
    document.getElementById('editSubject').value = question.subject || 'Biology';
    document.getElementById('editDifficulty').value = question.difficulty || 'Medium';
    
    modal.style.display = 'flex';
};

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const questionData = {
        questionText: document.getElementById('editQuestion').value,
        options: [
            document.getElementById('editOptionA').value,
            document.getElementById('editOptionB').value,
            document.getElementById('editOptionC').value,
            document.getElementById('editOptionD').value
        ],
        correctAnswer: document.getElementById('editCorrectAnswer').value,
        subject: document.getElementById('editSubject').value,
        difficulty: document.getElementById('editDifficulty').value,
        language: 'English',
        imageRef: currentEditingData?.imageRef || null
    };

    showLoading(true, 'Saving question...');

    try {
        const response = await fetch(`${API_BASE}/questions/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to save question');
        }

        showLoading(false);
        showAlert('Question saved successfully!', 'success');
        modal.style.display = 'none';
        
        // Clear uploaded files
        imageInput.value = '';
        pdfInput.value = '';
        document.getElementById('imageExtracted').style.display = 'none';
        document.getElementById('pdfExtracted').style.display = 'none';
        
        // Refresh library
        loadQuestions();
    } catch (error) {
        showLoading(false);
        showAlert(error.message, 'error');
    }
});

// ==================== Manual Entry ====================

const manualForm = document.getElementById('manualForm');

manualForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const questionData = {
        questionText: document.getElementById('manualQuestion').value,
        options: [
            document.getElementById('optionA').value,
            document.getElementById('optionB').value,
            document.getElementById('optionC').value,
            document.getElementById('optionD').value
        ],
        correctAnswer: document.getElementById('correctAnswer').value,
        subject: document.getElementById('manualSubject').value,
        difficulty: document.getElementById('manualDifficulty').value,
        language: document.getElementById('manualLanguage').value,
        chapter: document.getElementById('manualChapter').value,
        explanation: document.getElementById('manualExplanation').value
    };

    showLoading(true, 'Saving question...');

    try {
        const response = await fetch(`${API_BASE}/questions/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to save question');
        }

        showLoading(false);
        showAlert('Question saved successfully!', 'success');
        manualForm.reset();
        
        // Refresh library
        loadQuestions();
    } catch (error) {
        showLoading(false);
        showAlert(error.message, 'error');
    }
});

// ==================== Question Library ====================

async function loadQuestions() {
    try {
        const response = await fetch(`${API_BASE}/questions`);
        const data = await response.json();
        
        allQuestions = data.questions || [];
        displayQuestions(allQuestions);
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

function displayQuestions(questions) {
    const container = document.getElementById('questionsList');
    
    if (questions.length === 0) {
        container.innerHTML = '<p>No questions found.</p>';
        return;
    }

    let html = '';
    questions.forEach(q => {
        html += `
            <div class="question-card">
                <div class="question-card-header">
                    <h3>${escapeHtml(q.questionText)}</h3>
                </div>
                
                <div class="question-card-meta">
                    <span class="badge badge-subject">${q.subject}</span>
                    <span class="badge badge-difficulty">${q.difficulty}</span>
                    <span class="meta-item">📖 ${q.chapter || 'No chapter'}</span>
                </div>
                
                <div class="question-card-options">
                    <div class="option">A) ${escapeHtml(q.options[0])}</div>
                    <div class="option">B) ${escapeHtml(q.options[1])}</div>
                    <div class="option">C) ${escapeHtml(q.options[2])}</div>
                    <div class="option correct">D) ✓ ${escapeHtml(q.options[3])}</div>
                </div>
                
                ${q.explanation ? `<p><small><strong>Explanation:</strong> ${escapeHtml(q.explanation)}</small></p>` : ''}
                
                <div class="question-card-actions">
                    <button class="btn btn-secondary" onclick="editQuestion('${q.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteQuestion('${q.id}')">Delete</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

const searchInput = document.getElementById('searchQuestions');
const filterSubject = document.getElementById('filterSubject');
const filterDifficulty = document.getElementById('filterDifficulty');

function filterQuestions() {
    const search = searchInput.value.toLowerCase();
    const subject = filterSubject.value;
    const difficulty = filterDifficulty.value;

    const filtered = allQuestions.filter(q => {
        const matchesSearch = q.questionText.toLowerCase().includes(search);
        const matchesSubject = !subject || q.subject === subject;
        const matchesDifficulty = !difficulty || q.difficulty === difficulty;
        
        return matchesSearch && matchesSubject && matchesDifficulty;
    });

    displayQuestions(filtered);
}

searchInput.addEventListener('input', filterQuestions);
filterSubject.addEventListener('change', filterQuestions);
filterDifficulty.addEventListener('change', filterQuestions);

window.editQuestion = async function(id) {
    const question = allQuestions.find(q => q.id === id);
    if (question) {
        openEditModal(question);
    }
};

window.deleteQuestion = async function(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    showLoading(true, 'Deleting question...');

    try {
        const response = await fetch(`${API_BASE}/questions/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete question');
        }

        showLoading(false);
        showAlert('Question deleted successfully!', 'success');
        loadQuestions();
    } catch (error) {
        showLoading(false);
        showAlert(error.message, 'error');
    }
};

// ==================== Initialize ====================

loadQuestions();
