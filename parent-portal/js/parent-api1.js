// js/parent-api.js
// ============================================
// School Report System - Parent API Client
// ============================================

class ParentAPI {
    constructor() {
        this.apiUrl = CONFIG.API_URL;
        this.schoolId = CONFIG.SCHOOL_ID;
        this.apiKey = CONFIG.API_KEY;
        this.currentStudent = null;
        this.currentReport = null;
    }
    
    /**
     * Make API call to Google Apps Script
     */
    async call(action, params = {}, method = 'GET') {
        try {
            const url = new URL(this.apiUrl);
            
            // Add authentication params
            params.schoolId = this.schoolId;
            params.apiKey = this.apiKey;
            
            if (method === 'GET') {
                url.searchParams.append('action', action);
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        url.searchParams.append(key, value);
                    }
                });
                
                const response = await fetch(url.toString());
                const result = await response.json();
                
                if (result.status === 'error') {
                    throw new Error(result.data.error || 'API error');
                }
                
                return result.data;
            } else {
                const response = await fetch(url.toString(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: action,
                        ...params,
                        schoolId: this.schoolId,
                        apiKey: this.apiKey
                    })
                });
                
                const result = await response.json();
                
                if (result.status === 'error') {
                    throw new Error(result.data.error || 'API error');
                }
                
                return result.data;
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    /**
     * Validate PIN for a student
     * @param {string} pin - 6-digit PIN
     * @param {string} className - Class name
     * @returns {Object} Student data
     */
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
    
    /**
     * Get full report for a student
     * @param {string} studentId - Student ID
     * @param {string} term - Term (optional)
     * @returns {Object} Report data
     */
    async getReport(studentId, term = null) {
        const params = { studentId: studentId };
        if (term) {
            params.term = term;
        }
        
        // If term is not specified or is Term3, get cumulative report
        if (!term || term === 'Term3') {
            const report = await this.call('generateCumulativeReport', { studentId });
            this.currentReport = report;
            return report;
        }
        
        const report = await this.call('getReportCard', params);
        this.currentReport = report;
        return report;
    }
    
    /**
     * Get student scores for a specific term
     * @param {string} studentId - Student ID
     * @param {number} term - Term number (1, 2, 3)
     * @returns {Array} Scores
     */
    async getStudentScores(studentId, term) {
        return await this.call('getStudentScores', { 
            studentId: studentId, 
            term: term 
        });
    }
    
    /**
     * Get attendance for a student
     * @param {string} studentId - Student ID
     * @param {number} term - Term number
     * @returns {Object} Attendance data
     */
    async getAttendance(studentId, term) {
        return await this.call('getAttendance', { 
            studentId: studentId, 
            term: term 
        });
    }
    
    /**
     * Get behavioral scores for a student
     * @param {string} studentId - Student ID
     * @param {number} term - Term number
     * @returns {Array} Behavioral scores
     */
    async getBehavioral(studentId, term) {
        return await this.call('getBehavioral', { 
            studentId: studentId, 
            term: term 
        });
    }
    
    /**
     * Get comments for a student
     * @param {string} studentId - Student ID
     * @param {number} term - Term number
     * @returns {Object} Comments
     */
    async getComments(studentId, term) {
        return await this.call('getComments', { 
            studentId: studentId, 
            term: term 
        });
    }
    
    /**
     * Calculate grade based on score
     */
    calculateGrade(score) {
        const grading = CONFIG.GRADING;
        for (const [grade, range] of Object.entries(grading)) {
            if (score >= range.min && score <= range.max) {
                return grade;
            }
        }
        return 'F';
    }
    
    /**
     * Get grade color
     */
    getGradeColor(grade) {
        const grading = CONFIG.GRADING;
        return grading[grade] || { color: '#000000', cssClass: '' };
    }
    
    /**
     * Calculate GPA
     */
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
    
    /**
     * Format date
     */
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
    // ADMIN METHODS
    // ============================================

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
}

// Create global instance
const api = new ParentAPI();