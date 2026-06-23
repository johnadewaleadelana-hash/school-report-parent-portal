// js/admin-scores.js
// ============================================
// Admin - Score Management Logic
// ============================================

let currentStudents = [];
let currentScores = [];
let currentSubjects = [];
let autoSaveTimer = null;
let isSaving = false;

document.addEventListener('DOMContentLoaded', function() {
    // Check admin session
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) {
        window.location.href = 'admin-login.html';
        return;
    }

    // Load subjects when class changes
    document.getElementById('scoreClass').addEventListener('change', loadStudentsAndSubjects);
    document.getElementById('scoreSubject').addEventListener('change', loadScores);
    document.getElementById('scoreTerm').addEventListener('change', loadScores);
});

// ============================================
// LOAD DATA
// ============================================

async function loadStudentsAndSubjects() {
    const className = document.getElementById('scoreClass').value;
    
    if (!className) {
        document.getElementById('scoresContainer').innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-edit fa-3x mb-3"></i>
                <p>Select a class and subject to enter scores</p>
            </div>
        `;
        document.getElementById('summaryStats').style.display = 'none';
        return;
    }

    try {
        // Load students
        currentStudents = await api.getStudents(className);
        
        // Load subjects for this class
        currentSubjects = await api.getSubjects(className);
        
        // Populate subject dropdown
        const subjectSelect = document.getElementById('scoreSubject');
        subjectSelect.innerHTML = '<option value="">Select Subject...</option>';
        currentSubjects.forEach(subject => {
            subjectSelect.innerHTML += `<option value="${subject['Subject ID']}">${subject['Subject Name']}</option>`;
        });
        
        // Load scores for the first subject
        if (currentSubjects.length > 0) {
            subjectSelect.value = currentSubjects[0]['Subject ID'];
            loadScores();
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data: ' + error.message, 'danger');
    }
}

async function loadScores() {
    const className = document.getElementById('scoreClass').value;
    const subjectId = document.getElementById('scoreSubject').value;
    const term = document.getElementById('scoreTerm').value;
    
    if (!className || !subjectId) {
        return;
    }

    try {
        // Get all scores for this class and subject
        const allScores = await api.getStudentScores(null, term);
        currentScores = allScores.filter(s => s['Subject ID'] === subjectId);
        
        // Match scores with students
        const scoresMap = {};
        currentScores.forEach(score => {
            scoresMap[score['Student ID']] = score;
        });
        
        // Build the table
        renderScoresTable(scoresMap);
        updateSummary(scoresMap);
        
    } catch (error) {
        console.error('Error loading scores:', error);
        showToast('Error loading scores: ' + error.message, 'danger');
    }
}

// ============================================
// RENDER TABLE
// ============================================

function renderScoresTable(scoresMap) {
    const container = document.getElementById('scoresContainer');
    
    if (currentStudents.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-users fa-3x mb-3"></i>
                <p>No students found in this class</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="table-responsive">
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>CA1 (0-20)</th>
                        <th>CA2 (0-20)</th>
                        <th>Exam (0-60)</th>
                        <th>Total</th>
                        <th>Grade</th>
                        <th>Remark</th>
                    </tr>
                </thead>
                <tbody>
    `;

    currentStudents.forEach((student, index) => {
        const score = scoresMap[student['Student ID']] || {};
        const ca1 = score['CA1'] || '';
        const ca2 = score['CA2'] || '';
        const exam = score['Exam'] || '';
        const total = score['Total'] || '';
        const grade = score['Grade'] || '-';
        const remark = score['Remark'] || '-';
        
        const gradeColor = getGradeColor(grade);
        const gradeStyle = grade !== '-' ? `background-color:${gradeColor};color:#fff;padding:4px 10px;border-radius:4px;` : '';

        html += `
            <tr data-student-id="${student['Student ID']}">
                <td>${index + 1}</td>
                <td><strong>${student['Full Name']}</strong></td>
                <td>${student['Student ID']}</td>
                <td>
                    <input type="number" class="form-control form-control-sm score-input ca" 
                           data-field="ca1" min="0" max="20" value="${ca1}"
                           onchange="onScoreChange(this)" onkeyup="onScoreChange(this)">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm score-input ca" 
                           data-field="ca2" min="0" max="20" value="${ca2}"
                           onchange="onScoreChange(this)" onkeyup="onScoreChange(this)">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm score-input exam" 
                           data-field="exam" min="0" max="60" value="${exam}"
                           onchange="onScoreChange(this)" onkeyup="onScoreChange(this)">
                </td>
                <td class="total-cell text-center fw-bold">${total || '-'}</td>
                <td class="grade-cell text-center">
                    <span class="grade-badge" style="${gradeStyle}">${grade}</span>
                </td>
                <td class="remark-cell text-center">${remark}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
    document.getElementById('summaryStats').style.display = 'block';
}

// ============================================
// SCORE CHANGE HANDLING
// ============================================

function onScoreChange(input) {
    const row = input.closest('tr');
    const studentId = row.dataset.studentId;
    
    // Get values
    const ca1 = parseFloat(row.querySelector('[data-field="ca1"]').value) || 0;
    const ca2 = parseFloat(row.querySelector('[data-field="ca2"]').value) || 0;
    const exam = parseFloat(row.querySelector('[data-field="exam"]').value) || 0;
    
    // Validate
    if (ca1 > 20) { row.querySelector('[data-field="ca1"]').value = 20; }
    if (ca2 > 20) { row.querySelector('[data-field="ca2"]').value = 20; }
    if (exam > 60) { row.querySelector('[data-field="exam"]').value = 60; }
    
    // Calculate total
    const total = ca1 + ca2 + exam;
    const grade = calculateGrade(total);
    const remark = calculateRemark(total);
    const gradeColor = getGradeColor(grade);
    
    // Update display
    row.querySelector('.total-cell').textContent = total || '-';
    const gradeSpan = row.querySelector('.grade-cell .grade-badge');
    gradeSpan.textContent = grade;
    gradeSpan.style.backgroundColor = gradeColor;
    gradeSpan.style.color = '#fff';
    gradeSpan.style.padding = '4px 10px';
    gradeSpan.style.borderRadius = '4px';
    row.querySelector('.remark-cell').textContent = remark;
    
    // Update stats
    updateSummaryFromTable();
    
    // Auto-save
    triggerAutoSave(studentId, ca1, ca2, exam, total, grade, remark);
}

// ============================================
// AUTO-SAVE
// ============================================

function triggerAutoSave(studentId, ca1, ca2, exam, total, grade, remark) {
    clearTimeout(autoSaveTimer);
    
    document.getElementById('savedIndicator').classList.remove('show');
    document.getElementById('autoSaveStatus').textContent = 'Saving...';
    
    autoSaveTimer = setTimeout(async function() {
        try {
            const term = document.getElementById('scoreTerm').value;
            const subjectId = document.getElementById('scoreSubject').value;
            
            await api.call('saveScores', {
                studentId: studentId,
                subjectId: subjectId,
                term: term,
                ca1: ca1,
                ca2: ca2,
                exam: exam,
                comment: ''
            });
            
            document.getElementById('savedIndicator').classList.add('show');
            document.getElementById('autoSaveStatus').textContent = 'Saved';
            
        } catch (error) {
            console.error('Auto-save error:', error);
            document.getElementById('autoSaveStatus').textContent = 'Error saving';
            document.getElementById('autoSaveStatus').style.color = '#dc3545';
        }
    }, 1000);
}

// ============================================
// SAVE ALL SCORES
// ============================================

async function saveAllScores() {
    if (isSaving) return;
    isSaving = true;
    
    const btn = document.querySelector('.btn-success');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;
    
    try {
        const term = document.getElementById('scoreTerm').value;
        const subjectId = document.getElementById('scoreSubject').value;
        const rows = document.querySelectorAll('#scoresContainer tbody tr');
        
        let saved = 0;
        for (const row of rows) {
            const studentId = row.dataset.studentId;
            const ca1 = parseFloat(row.querySelector('[data-field="ca1"]').value) || 0;
            const ca2 = parseFloat(row.querySelector('[data-field="ca2"]').value) || 0;
            const exam = parseFloat(row.querySelector('[data-field="exam"]').value) || 0;
            
            if (ca1 === 0 && ca2 === 0 && exam === 0) continue;
            
            const total = ca1 + ca2 + exam;
            const grade = calculateGrade(total);
            const remark = calculateRemark(total);
            
            await api.call('saveScores', {
                studentId: studentId,
                subjectId: subjectId,
                term: term,
                ca1: ca1,
                ca2: ca2,
                exam: exam,
                comment: ''
            });
            saved++;
        }
        
        showToast(`Saved ${saved} score records!`, 'success');
        document.getElementById('savedIndicator').classList.add('show');
        
    } catch (error) {
        console.error('Error saving scores:', error);
        showToast('Error saving scores: ' + error.message, 'danger');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        isSaving = false;
    }
}

// ============================================
// COPY FROM PREVIOUS TERM
// ============================================

async function copyFromPrevious() {
    const className = document.getElementById('scoreClass').value;
    const subjectId = document.getElementById('scoreSubject').value;
    const currentTerm = parseInt(document.getElementById('scoreTerm').value);
    
    if (!className || !subjectId) {
        showToast('Please select class and subject', 'warning');
        return;
    }
    
    if (currentTerm <= 1) {
        showToast('No previous term to copy from', 'warning');
        return;
    }
    
    if (!confirm('This will overwrite current scores. Continue?')) {
        return;
    }
    
    try {
        const previousTerm = currentTerm - 1;
        const allScores = await api.getStudentScores(null, previousTerm);
        const previousScores = allScores.filter(s => s['Subject ID'] === subjectId);
        
        // Fill in the scores
        const rows = document.querySelectorAll('#scoresContainer tbody tr');
        let filled = 0;
        
        for (const row of rows) {
            const studentId = row.dataset.studentId;
            const prevScore = previousScores.find(s => s['Student ID'] === studentId);
            
            if (prevScore) {
                row.querySelector('[data-field="ca1"]').value = prevScore['CA1'] || 0;
                row.querySelector('[data-field="ca2"]').value = prevScore['CA2'] || 0;
                row.querySelector('[data-field="exam"]').value = prevScore['Exam'] || 0;
                onScoreChange(row.querySelector('[data-field="ca1"]'));
                filled++;
            }
        }
        
        showToast(`Copied scores from Term ${previousTerm} for ${filled} students`, 'success');
        
    } catch (error) {
        console.error('Error copying scores:', error);
        showToast('Error copying scores: ' + error.message, 'danger');
    }
}

// ============================================
// SUMMARY UPDATES
// ============================================

function updateSummary(scoresMap) {
    const total = currentStudents.length;
    let filled = 0;
    let totalScore = 0;
    let scoreCount = 0;
    
    currentStudents.forEach(student => {
        const score = scoresMap[student['Student ID']];
        if (score && score['Total']) {
            filled++;
            totalScore += parseFloat(score['Total']);
            scoreCount++;
        }
    });
    
    document.getElementById('totalStudentsStat').textContent = total;
    document.getElementById('scoresEnteredStat').textContent = total > 0 ? Math.round((filled/total)*100) + '%' : '0%';
    document.getElementById('classAverageStat').textContent = scoreCount > 0 ? (totalScore/scoreCount).toFixed(1) : '0.0';
}

function updateSummaryFromTable() {
    const rows = document.querySelectorAll('#scoresContainer tbody tr');
    let total = rows.length;
    let filled = 0;
    let totalScore = 0;
    let scoreCount = 0;
    
    rows.forEach(row => {
        const totalCell = row.querySelector('.total-cell');
        if (totalCell && totalCell.textContent !== '-') {
            const score = parseFloat(totalCell.textContent);
            if (score > 0) {
                filled++;
                totalScore += score;
                scoreCount++;
            }
        }
    });
    
    document.getElementById('totalStudentsStat').textContent = total;
    document.getElementById('scoresEnteredStat').textContent = total > 0 ? Math.round((filled/total)*100) + '%' : '0%';
    document.getElementById('classAverageStat').textContent = scoreCount > 0 ? (totalScore/scoreCount).toFixed(1) : '0.0';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateGrade(total) {
    const grading = CONFIG.GRADING;
    for (const [grade, range] of Object.entries(grading)) {
        if (total >= range.min && total <= range.max) {
            return grade;
        }
    }
    return 'F';
}

function calculateRemark(total) {
    if (total >= 70) return 'Distinction';
    if (total >= 60) return 'Very Good';
    if (total >= 50) return 'Credit';
    if (total >= 40) return 'Pass';
    return 'Fail';
}

function getGradeColor(grade) {
    const grading = CONFIG.GRADING;
    return grading[grade]?.color || '#6c757d';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toastMessage');
    const body = document.getElementById('toastBody');
    
    toast.className = `toast align-items-center text-white border-0 bg-${type}`;
    body.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}