// js/parent-api.js - Complete Version
// ============================================

class ParentAPI {
    constructor() {
        this.apiUrl = CONFIG.API_URL;
        this.schoolId = CONFIG.SCHOOL_ID;
        this.apiKey = CONFIG.API_KEY;
        this.currentStudent = null;
        this.currentReport = null;
    }

    // ============================================
    // BASE API CALL
    // ============================================

    // js/parent-api.js - Updated call() method
// ============================================

    // js/parent-api.js - Updated call() method (GET only)
// ============================================

async call(action, params = {}, method = 'GET') {
    try {
        console.log(`📤 API Call: ${action}`, params);
        
        const url = new URL(this.apiUrl);
        
        // Add action and authentication params
        url.searchParams.append('action', action);
        url.searchParams.append('schoolId', this.schoolId);
        url.searchParams.append('apiKey', this.apiKey);
        
        // Add all other params
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                // Convert objects to JSON strings
                if (typeof value === 'object') {
                    url.searchParams.append(key, JSON.stringify(value));
                } else {
                    url.searchParams.append(key, value);
                }
            }
        });
        
        console.log('📤 Fetching URL:', url.toString());
        
        const response = await fetch(url.toString());
        const result = await response.json();
        
        console.log(`📥 Response (${action}):`, result);
        
        if (result.status === 'error') {
            throw new Error(result.data.error || 'API error');
        }
        
        return result.data;
        
    } catch (error) {
        console.error(`❌ API Error (${action}):`, error);
        throw error;
    }
}

    // ============================================
    // PARENT PORTAL METHODS
    // ============================================

    async validatePin(pin, className) {
        const result = await this.call('validatePin', { 
            pin: pin, 
            class: className 
        });
        
        if (result.valid) {
            this.currentStudent = result.student;
            return result;
        }
        
        throw new Error(result.message || 'Invalid PIN');
    }

    async getReport(studentId, term = null) {
        if (!term || term === 'Term3') {
            const report = await this.call('generateCumulativeReport', { studentId });
            this.currentReport = report;
            return report;
        }
        
        const report = await this.call('getReportCard', { studentId, term });
        this.currentReport = report;
        return report;
    }

    async getStudentScores(studentId, term) {
        return await this.call('getStudentScores', { 
            studentId: studentId, 
            term: term 
        });
    }

    async getAttendance(studentId, term) {
        return await this.call('getAttendance', { 
            studentId: studentId, 
            term: term 
        });
    }

    async getBehavioral(studentId, term) {
        return await this.call('getBehavioral', { 
            studentId: studentId, 
            term: term 
        });
    }

    async getComments(studentId, term) {
        return await this.call('getComments', { 
            studentId: studentId, 
            term: term 
        });
    }

    // ============================================
    // ADMIN METHODS
    // ============================================

    /**
     * Get all students
     * @param {string} className - Optional class filter
     * @returns {Array} List of students
     */
    async getStudents(className = null) {
        return await this.call('getStudents', { class: className });
    }

    /**
     * Get a single student by ID
     * @param {string} studentId - Student ID
     * @returns {Object} Student data
     */
    async getStudent(studentId) {
        return await this.call('getStudent', { studentId });
    }

    /**
     * Add a new student
     * @param {Object} data - Student data
     * @returns {Object} Result
     */
    async addStudent(data) {
        return await this.call('addStudent', data, 'POST');
    }

    /**
     * Update a student
     * @param {Object} data - Student data with studentId
     * @returns {Object} Result
     */
    async updateStudent(data) {
        return await this.call('updateStudent', data, 'POST');
    }

    /**
     * Delete a student (soft delete)
     * @param {string} studentId - Student ID
     * @returns {Object} Result
     */
    async deleteStudent(studentId) {
        return await this.call('deleteStudent', { studentId: studentId }, 'POST');
    }

    /**
     * Get all teachers
     * @returns {Array} List of teachers
     */
    async getTeachers() {
        return await this.call('getTeachers');
    }

    

    /**
     * Get all classes
     * @returns {Array} List of classes
     */
    async getClasses() {
        return await this.call('getClasses');
    }

    /**
     * Get school settings
     * @returns {Object} Settings
     */
    async getSettings() {
        return await this.call('getSettings');
    }

    /**
     * Generate PINs for a class
     * @param {string} className - Class name
     * @param {string} term - Term
     * @returns {Object} Result
     */
    async generatePins(className, term) {
        return await this.call('generatePins', { 
            class: className, 
            term: term 
        }, 'POST');
    }

    /**
     * Get PIN status for a class
     * @param {string} className - Class name
     * @returns {Object} PIN statistics
     */
    async getPinStatus(className) {
        return await this.call('getPinStatus', { class: className });
    }

    /**
     * Revoke a PIN
     * @param {string} studentId - Student ID
     * @returns {Object} Result
     */
    async revokePin(studentId) {
        return await this.call('revokePin', { studentId: studentId }, 'POST');
    }

    /**
     * Get promotion status for a student
     * @param {string} studentId - Student ID
     * @returns {Object} Promotion status
     */
    async getPromotionStatus(studentId) {
        return await this.call('getPromotionStatus', { studentId });
    }

    /**
     * Get academic calendar
     * @returns {Array} Academic calendar
     */
    async getAcademicCalendar() {
        return await this.call('getAcademicCalendar');
    }

    /**
     * Generate a transcript
     * @param {string} studentId - Student ID
     * @param {string} type - Transcript type
     * @param {Object} options - Additional options
     * @returns {Object} Transcript data
     */
    async generateTranscript(studentId, type = 'standard', options = {}) {
        return await this.call('generateTranscript', { 
            studentId: studentId, 
            type: type,
            ...options 
        });
    }

    /**
     * Generate a broadsheet
     * @param {string} className - Class name
     * @param {string} term - Term
     * @param {string} type - Broadsheet type
     * @returns {Object} Broadsheet data
     */
    async generateBroadsheet(className, term, type = 'full') {
        return await this.call('generateBroadsheet', { 
            class: className, 
            term: term, 
            type: type 
        });
    }

    /**
     * Get class analysis
     * @param {string} className - Class name
     * @param {string} term - Term
     * @returns {Object} Class analysis
     */
    async getClassAnalysis(className, term) {
        return await this.call('getClassAnalysis', { 
            class: className, 
            term: term 
        });
    }

    /**
     * Get student analysis
     * @param {string} studentId - Student ID
     * @returns {Object} Student analysis
     */
    async getStudentAnalysis(studentId) {
        return await this.call('getStudentAnalysis', { studentId });
    }

    /**
     * Get school analysis
     * @param {string} term - Term
     * @returns {Object} School analysis
     */
    async getSchoolAnalysis(term) {
        return await this.call('getSchoolAnalysis', { term });
    }

    /**
     * Get teacher analysis
     * @param {string} teacherId - Teacher ID
     * @returns {Object} Teacher analysis
     */
    async getTeacherAnalysis(teacherId) {
        return await this.call('getTeacherAnalysis', { teacherId });
    }
    
    // ============================================
    // TEACHER METHODS
    // ============================================

    /**
     * Add a new teacher
     * @param {Object} data - Teacher data
     * @returns {Object} Result
     */
    async addTeacher(data) {
        return await this.call('addTeacher', data);
    }

    /**
     * Update a teacher
     * @param {Object} data - Teacher data with teacherId
     * @returns {Object} Result
     */
    async updateTeacher(data) {
        return await this.call('updateTeacher', data);
    }

    /**
     * Delete a teacher
     * @param {string} teacherId - Teacher ID
     * @returns {Object} Result
     */
    async deleteTeacher(data) {
        return await this.call('deleteTeacher', { teacherId: data.teacherId });
    }
    // ============================================
    // UTILITY METHODS
    // ============================================

    calculateGrade(score) {
        const grading = CONFIG.GRADING;
        for (const [grade, range] of Object.entries(grading)) {
            if (score >= range.min && score <= range.max) {
                return grade;
            }
        }
        return 'F';
    }

    getGradeColor(grade) {
        const grading = CONFIG.GRADING;
        return grading[grade] || { color: '#000000', cssClass: '' };
    }

    calculateGPA(average) {
        if (average >= 90) return 4.0;
        if (average >= 80) return 3.5;
        if (average >= 75) return 3.25;
        if (average >= 70) return 3.0;
        if (average >= 65) return 2.75;
        if (average >= 60) return 2.5;
        if (average >= 55) return 2.25;
        if (average >= 50) return 2.0;
        if (average >= 45) return 1.75;
        if (average >= 40) return 1.5;
        if (average >= 35) return 1.25;
        if (average >= 30) return 1.0;
        if (average >= 25) return 0.75;
        if (average >= 20) return 0.5;
        if (average >= 15) return 0.25;
        return 0;
    }

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // ============================================
// SUBJECT METHODS
// ============================================

/**
 * Get all subjects
 * @param {string} className - Optional class filter
 * @returns {Array} List of subjects
 */
async getSubjects(className = null) {
    return await this.call('getSubjects', { class: className });
}

/**
 * Add a new subject
 * @param {Object} data - Subject data
 * @returns {Object} Result
 */
async addSubject(data) {
    return await this.call('addSubject', data);
}

/**
 * Update a subject
 * @param {Object} data - Subject data with subjectId
 * @returns {Object} Result
 */
async updateSubject(data) {
    return await this.call('updateSubject', data);
}

/**
 * Delete a subject
 * @param {Object} data - Subject data with subjectId
 * @returns {Object} Result
 */
async deleteSubject(data) {
    return await this.call('deleteSubject', { subjectId: data.subjectId });
}
}

// Create global instance
const api = new ParentAPI();
console.log('✅ ParentAPI initialized');