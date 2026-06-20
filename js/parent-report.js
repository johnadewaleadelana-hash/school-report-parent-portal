// js/parent-report.js
// ============================================
// Parent Report Viewer Logic
// ============================================

let reportData = null;
let studentData = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Check if logged in
    const storedStudent = sessionStorage.getItem('parentStudent');
    if (!storedStudent) {
        window.location.href = 'parent-login.html';
        return;
    }
    
    try {
        studentData = JSON.parse(storedStudent);
        
        // Get report data (from session or fetch)
        const storedReport = sessionStorage.getItem('parentReport');
        if (storedReport) {
            reportData = JSON.parse(storedReport);
            renderReport();
        } else {
            await fetchReport();
        }
    } catch (e) {
        console.error('Error loading report:', e);
        showError('Unable to load report. Please try again.');
    }
});

async function fetchReport() {
    try {
        const container = document.getElementById('reportContainer');
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-spinner fa-spin fa-3x text-primary"></i>
                <p class="mt-3">Loading report...</p>
            </div>
        `;
        
        reportData = await api.getReport(studentData['Student ID'], 'Term3');
        sessionStorage.setItem('parentReport', JSON.stringify(reportData));
        renderReport();
    } catch (error) {
        console.error('Error fetching report:', error);
        showError('Unable to fetch report data. Please try again.');
    }
}

function renderReport() {
    const container = document.getElementById('reportContainer');
    
    if (!reportData || reportData.error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                ${reportData?.error || 'No report data available'}
            </div>
        `;
        return;
    }
    
    const student = reportData.student || studentData;
    const settings = reportData.settings || {};
    const scores = reportData.scores || [];
    const avg = reportData.average || 0;
    const grade = reportData.grade || 'F';
    const gpa = reportData.gpa || 0;
    const headComment = reportData.headTeacherComment || '';
    const promotion = reportData.promotion || {};
    const behavioral = reportData.behavioral || {};
    const comments = reportData.comments || {};
    
    // Build HTML
    let html = `
        <!-- Report Header -->
        <div class="card shadow-lg mb-4">
            <div class="card-header bg-primary text-white text-center py-4">
                <h2 class="mb-0">${CONFIG.SCHOOL_NAME}</h2>
                <p class="mb-0">${CONFIG.SCHOOL_MOTTO}</p>
                <small>${CONFIG.SCHOOL_ADDRESS}</small>
            </div>
            <div class="card-body">
                <!-- Student Info -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h5><i class="fas fa-user"></i> Student Information</h5>
                        <table class="table table-sm table-borderless">
                            <tr><td><strong>Name:</strong></td><td>${student['Full Name'] || ''}</td></tr>
                            <tr><td><strong>Class:</strong></td><td>${student['Class'] || ''}</td></tr>
                            <tr><td><strong>Student ID:</strong></td><td>${student['Student ID'] || ''}</td></tr>
                            <tr><td><strong>Academic Year:</strong></td><td>${CONFIG.ACADEMIC_YEAR}</td></tr>
                            <tr><td><strong>Term:</strong></td><td>${CONFIG.CURRENT_TERM.replace('Term', 'Term ')}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h5><i class="fas fa-chart-bar"></i> Summary</h5>
                        <table class="table table-sm table-borderless">
                            <tr><td><strong>Average:</strong></td><td><span class="badge bg-primary">${avg.toFixed(2)}%</span></td></tr>
                            <tr><td><strong>Grade:</strong></td><td><span class="badge grade-badge" style="background-color:${api.getGradeColor(grade).color};color:#fff;">${grade}</span></td></tr>
                            <tr><td><strong>GPA:</strong></td><td><span class="badge bg-info">${gpa.toFixed(2)}</span></td></tr>
                            <tr><td><strong>Subjects:</strong></td><td>${scores.length}</td></tr>
                            <tr><td><strong>Status:</strong></td><td>${promotion.promoted ? '✅ Promoted' : '📚 In Progress'}</td></tr>
                        </table>
                    </div>
                </div>
                
                <!-- Scores Table -->
                <h5><i class="fas fa-table"></i> Subject Performance</h5>
                <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Subject</th>
                                <th>Term 1</th>
                                <th>Term 2</th>
                                <th>Term 3</th>
                                <th>Cumulative</th>
                                <th>Grade</th>
                                <th>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    scores.forEach(subject => {
        const cumulative = subject.cumulative || 0;
        const grade = subject.grade || 'F';
        const gradeInfo = api.getGradeColor(grade);
        html += `
            <tr>
                <td><strong>${subject.subject}</strong></td>
                <td>${subject.term1 || '-'}</td>
                <td>${subject.term2 || '-'}</td>
                <td>${subject.term3 || '-'}</td>
                <td><strong>${cumulative.toFixed(2)}</strong></td>
                <td><span class="badge" style="background-color:${gradeInfo.color};color:#fff;">${grade}</span></td>
                <td><small>${subject.remark || '-'}</small></td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
                
                <!-- Behavioral -->
                <h5 class="mt-4"><i class="fas fa-users"></i> Behavioral Domains</h5>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Domain</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Get behavioral data
    const behavioralData = reportData.behavioral || {};
    const behavioralScores = behavioralData.term3 || [];
    if (behavioralScores.length > 0) {
        behavioralScores.forEach(item => {
            const domainName = item['Domain Name'] || item['Domain ID'];
            const score = item['Score'] || 0;
            const rubric = api.getRubric ? api.getRubric(score) : null;
            html += `
                <tr>
                    <td>${domainName}</td>
                    <td>
                        <span class="badge ${score >= 4 ? 'bg-success' : score >= 3 ? 'bg-warning' : 'bg-danger'}" 
                              style="font-size:1rem;padding:8px 12px;">
                            ${score}/5
                            ${rubric ? `- ${rubric.Label}` : ''}
                        </span>
                    </td>
                </tr>
            `;
        });
    } else {
        html += `<tr><td colspan="2" class="text-center text-muted">No behavioral data available</td></tr>`;
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
                
                <!-- Comments -->
                <h5 class="mt-4"><i class="fas fa-comment"></i> Comments</h5>
                <div class="card bg-light mb-2">
                    <div class="card-body">
                        <h6>Tutor's Comment</h6>
                        <p class="mb-0">${comments.term3?.tutor || comments.Tutor_Comment || 'No comment'}</p>
                    </div>
                </div>
                <div class="card bg-light">
                    <div class="card-body">
                        <h6>Head Teacher's Comment</h6>
                        <p class="mb-0">${headComment || 'No comment'}</p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="text-center mt-4 pt-3 border-top">
                    <small class="text-muted">
                        Generated on: ${new Date().toLocaleDateString()}
                        ${CONFIG.WATERMARK_TEXT ? ` | ${CONFIG.WATERMARK_TEXT}` : ''}
                    </small>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function showError(message) {
    const container = document.getElementById('reportContainer');
    container.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i>
            ${message}
            <br><br>
            <a href="parent-dashboard.html" class="btn btn-primary btn-sm">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </a>
        </div>
    `;
}

// Download PDF
function downloadPDF() {
    const element = document.getElementById('reportContainer');
    const opt = {
        margin: 10,
        filename: `${CONFIG.PDF_FILENAME_PREFIX}${studentData['Full Name'] || 'student'}_${CONFIG.CURRENT_TERM}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf()
        .set(opt)
        .from(element)
        .save()
        .catch(error => {
            console.error('PDF generation error:', error);
            alert('Unable to generate PDF. Please try using the print function.');
        });
}