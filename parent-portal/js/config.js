// js/config.js
// ============================================
// School Report System - Parent Portal Configuration
// ============================================

const CONFIG = {
    // ============================================
    // API Configuration
    // ============================================
    
    // Your Google Apps Script Web App URL
    API_URL: 'https://script.google.com/macros/s/AKfycbyh7CNHiJFyY1GXm8_koKobtMdyQGd5RI1oyRT1V5BuZNqleeqk-D_XgRfjKHJOYaBbXA/exec',
    
    // School credentials
    SCHOOL_ID: 'SCH001',
    API_KEY: 'API_KEY_001',
    
    // ============================================
    // School Information
    // ============================================
    
    SCHOOL_NAME: 'L\'école Peniel',
    SCHOOL_MOTTO: 'Grooming the total child',
    SCHOOL_ADDRESS: 'Along AAUA Permanent Site Road, Akungba Akoko, Ondo State',
    SCHOOL_PHONE: '08012345678',
    SCHOOL_EMAIL: 'info@penielschool.com',
    
    // ============================================
    // Grading System (Traffic Light Colors)
    // ============================================
    
    GRADING: {
        A: { min: 70, max: 100, label: 'Distinction', color: '#28a745', cssClass: 'grade-a' },
        B: { min: 60, max: 69, label: 'Very Good', color: '#8bc34a', cssClass: 'grade-b' },
        C: { min: 50, max: 59, label: 'Credit', color: '#ffc107', cssClass: 'grade-c' },
        D: { min: 45, max: 49, label: 'Pass', color: '#fd7e14', cssClass: 'grade-d' },
        E: { min: 40, max: 44, label: 'Pass', color: '#f44336', cssClass: 'grade-e' },
        F: { min: 0, max: 39, label: 'Fail', color: '#d32f2f', cssClass: 'grade-f' }
    },
    
    // ============================================
    // Behavioral Domains
    // ============================================
    
    BEHAVIORAL_DOMAINS: {
        'Psychomotor': ['Fine Motor Skills', 'Gross Motor Skills', 'Coordination'],
        'Affective': ['Attention Span', 'Emotional Regulation', 'Self-Confidence', 'Social Skills'],
        'Social': ['Punctuality', 'Attendance', 'Relationship with Others', 'Sense of Responsibility', 'Honesty']
    },
    
    // ============================================
    // Session Settings
    // ============================================
    
    SESSION_TIMEOUT: 1800, // 30 minutes in seconds
    TERMS: ['Term1', 'Term2', 'Term3'],
    CURRENT_TERM: 'Term3',
    ACADEMIC_YEAR: '2024/2025',
    
    // ============================================
    // Display Settings
    // ============================================
    
    SHOW_GPA: true,
    SHOW_ATTENDANCE: true,
    SHOW_BEHAVIORAL: true,
    SHOW_COMMENTS: true,
    SHOW_SCHOOL_LOGO: true,
    
    // ============================================
    // PDF Settings
    // ============================================
    
    PDF_FILENAME_PREFIX: 'Report_Card_',
    WATERMARK_TEXT: 'OFFICIAL COPY',
    WATERMARK_OPACITY: 0.1
};