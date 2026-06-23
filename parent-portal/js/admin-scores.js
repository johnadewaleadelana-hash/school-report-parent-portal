// js/admin-scores.js - COMPLETE FIXED VERSION
// ============================================
// Admin - Score Management Logic

let currentStudents = [];
let currentScores = [];
let currentSubjects = [];
let autoSaveTimer = null;
let isSaving = false;

document.addEventListener('DOMContentLoaded', function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) {
        window.location.href = 'admin-login.html';
        return;
    }

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
        currentStudents = await api.getStudents(className);
        currentSubjects = await api.getSubjects(className);
        
        const subjectSelect = document.getElementById('scoreSubject');
        subjectSelect.innerHTML = '<option value="">Select Subject...</option>';
        currentSubjects.forEach(subject => {
            subjectSelect.innerHTML += `<option value="${subject['Subject ID']}">${subject['Subject Name']}</option>`;
        });
        
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
    
    if (!className || !subjectId) return;

    try {
        const allScores = await api.getStudentScores(null, term);
        currentScores = allScores.filter(s => s['Subject ID'] === subjectId);
        
        const scoresMap = {};
        currentScores.forEach(score => {
            scoresMap[score['Student ID']] = score;
        });
        
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
    if (!row) return;
    
    const studentId = row.dataset.studentId;
    
    const ca1Input = row.querySelector('[data-field="ca1"]');
    const ca2Input = row.querySelector('[data-field="ca2"]');
    const examInput = row.querySelector('[data-field="exam"]');
    
    if (!ca1Input || !ca2Input || !examInput) return;
    
    const ca1 = parseFloat(ca1Input.value) || 0;
    const ca2 = parseFloat(ca2Input.value) || 0;
    const exam = parseFloat(examInput.value) || 0;
    
    if (ca1 > 20) ca1Input.value = 20;
    if (ca2 > 20) ca2Input.value = 20;
    if (exam > 60) examInput.value = 60;
    
    const total = Math.min(ca1, 20) + Math.min(ca2, 20) + Math.min(exam, 60);
    const grade = calculateGrade(total);
    const remark = calculateRemark(total);
    const gradeColor = getGradeColor(grade);
    
    const totalCell = row.querySelector('.total-cell');
    const gradeSpan = row.querySelector('.grade-cell .grade-badge');
    const remarkCell = row.querySelector('.remark-cell');
    
    if (totalCell) totalCell.textContent = total || '-';
    if (gradeSpan) {
        gradeSpan.textContent = grade;
        gradeSpan.style.backgroundColor = gradeColor;
        gradeSpan.style.color = '#fff';
        gradeSpan.style.padding = '4px 10px';
        gradeSpan.style.borderRadius = '4px';
    }
    if (remarkCell) remarkCell.textContent = remark;
    
    updateSummaryFromTable();
    triggerAutoSave(studentId, Math.min(ca1, 20), Math.min(ca2, 20), Math.min(exam, 60));
}

// ============================================
// AUTO-SAVE
// ============================================

function triggerAutoSave(studentId, ca1, ca2, exam) {
    clearTimeout(autoSaveTimer);
    
    const savedIndicator = document.getElementById('savedIndicator');
    const autoSaveStatus = document.getElementById('autoSaveStatus');
    
    if (savedIndicator) savedIndicator.classList.remove('show');
    if (autoSaveStatus) {
        autoSaveStatus.textContent = 'Saving...';
        autoSaveStatus.style.color = '#6c757d';
    }
    
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
            
            if (savedIndicator) savedIndicator.classList.add('show');
            if (autoSaveStatus) {
                autoSaveStatus.textContent = 'Saved';
                autoSaveStatus.style.color = '#28a745';
            }
            
        } catch (error) {
            console.error('Auto-save error:', error);
            if (autoSaveStatus) {
                autoSaveStatus.textContent = 'Error saving';
                autoSaveStatus.style.color = '#dc3545';
            }
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
    const originalText = btn ? btn.innerHTML : 'Save All';
    
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;
    }
    
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
        
        showToast(`✅ Saved ${saved} score records!`, 'success');
        
        const indicator = document.getElementById('savedIndicator');
        if (indicator) indicator.classList.add('show');
        
        updateSummaryFromTable();
        
    } catch (error) {
        console.error('Error saving scores:', error);
        showToast('Error saving scores: ' + error.message, 'danger');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
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
    
    if (!confirm('This will overwrite current scores. Continue?')) return;
    
    try {
        const previousTerm = currentTerm - 1;
        const allScores = await api.getStudentScores(null, previousTerm);
        const previousScores = allScores.filter(s => s['Subject ID'] === subjectId);
        
        const rows = document.querySelectorAll('#scoresContainer tbody tr');
        let filled = 0;
        
        for (const row of rows) {
            const studentId = row.dataset.studentId;
            const prevScore = previousScores.find(s => s['Student ID'] === studentId);
            
            if (prevScore) {
                const ca1Input = row.querySelector('[data-field="ca1"]');
                const ca2Input = row.querySelector('[data-field="ca2"]');
                const examInput = row.querySelector('[data-field="exam"]');
                
                if (ca1Input) ca1Input.value = prevScore['CA1'] || 0;
                if (ca2Input) ca2Input.value = prevScore['CA2'] || 0;
                if (examInput) examInput.value = prevScore['Exam'] || 0;
                
                if (ca1Input) onScoreChange(ca1Input);
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
    
    const totalStudentsStat = document.getElementById('totalStudentsStat');
    const scoresEnteredStat = document.getElementById('scoresEnteredStat');
    const classAverageStat = document.getElementById('classAverageStat');
    
    if (totalStudentsStat) totalStudentsStat.textContent = total;
    if (scoresEnteredStat) {
        scoresEnteredStat.textContent = total > 0 ? Math.round((filled/total)*100) + '%' : '0%';
    }
    if (classAverageStat) {
        classAverageStat.textContent = scoreCount > 0 ? (totalScore/scoreCount).toFixed(1) : '0.0';
    }
}

function updateSummaryFromTable() {
    const rows = document.querySelectorAll('#scoresContainer tbody tr');
    let total = rows.length;
    let filled = 0;
    let totalScore = 0;
    let scoreCount = 0;
    
    rows.forEach(row => {
        const totalCell = row.querySelector('.total-cell');
        if (totalCell && totalCell.textContent && totalCell.textContent !== '-') {
            const score = parseFloat(totalCell.textContent);
            if (score > 0) {
                filled++;
                totalScore += score;
                scoreCount++;
            }
        }
    });
    
    const totalStudentsStat = document.getElementById('totalStudentsStat');
    const scoresEnteredStat = document.getElementById('scoresEnteredStat');
    const classAverageStat = document.getElementById('classAverageStat');
    
    if (totalStudentsStat) totalStudentsStat.textContent = total;
    if (scoresEnteredStat) {
        scoresEnteredStat.textContent = total > 0 ? Math.round((filled/total)*100) + '%' : '0%';
    }
    if (classAverageStat) {
        classAverageStat.textContent = scoreCount > 0 ? (totalScore/scoreCount).toFixed(1) : '0.0';
    }
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
    if (!toast) return;
    
    toast.className = `toast align-items-center text-white border-0 bg-${type}`;
    body.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}