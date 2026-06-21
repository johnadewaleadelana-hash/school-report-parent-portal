// js/admin-students.js
// ============================================
// Admin - Student Management Logic
// ============================================

let allStudents = [];
let currentPage = 1;
const pageSize = 20;
let studentModal = null;
let deleteModal = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', function() {
    // Check admin session
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) {
        window.location.href = 'admin-login.html';
        return;
    }

    // Initialize modals
    studentModal = new bootstrap.Modal(document.getElementById('studentModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    // Load students
    loadStudents();

    // Save button handler
    document.getElementById('saveStudentBtn').addEventListener('click', saveStudent);
    
    // Confirm delete handler
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

async function loadStudents() {
    try {
        const classFilter = document.getElementById('classFilter').value;
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;

        // Fetch students
        let students = await api.getStudents();
        allStudents = students;

        // Apply filters
        let filtered = students;

        if (classFilter) {
            filtered = filtered.filter(s => s['Class'] === classFilter);
        }

        if (statusFilter) {
            filtered = filtered.filter(s => s['Status'] === statusFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(s => 
                s['Full Name'].toLowerCase().includes(searchQuery) ||
                s['Student ID'].toLowerCase().includes(searchQuery)
            );
        }

        // Pagination
        const totalRecords = filtered.length;
        const totalPages = Math.ceil(totalRecords / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const pageData = filtered.slice(startIndex, startIndex + pageSize);

        // Display
        renderStudents(pageData);
        updatePagination(currentPage, totalPages, totalRecords);

    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Error loading students: ' + error.message, 'danger');
    }
}

function renderStudents(students) {
    const tbody = document.getElementById('studentsBody');
    
    if (!students || students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="fas fa-users fa-2x d-block mb-2"></i>
                    No students found
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    students.forEach((student, index) => {
        const statusClass = student['Status'] === 'Active' ? 'bg-success' :
                           student['Status'] === 'Inactive' ? 'bg-secondary' :
                           student['Status'] === 'Graduated' ? 'bg-info' : 'bg-warning';

        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${student['Student ID']}</strong></td>
                <td>${student['Full Name']}</td>
                <td>${student['Class']}</td>
                <td>${student['Parent Email'] || '-'}</td>
                <td>${student['Phone'] || '-'}</td>
                <td>
                    <span class="badge ${statusClass}">${student['Status']}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editStudent('${student['Student ID']}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent('${student['Student ID']}', '${student['Full Name']}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function updatePagination(currentPage, totalPages, totalRecords) {
    const controls = document.getElementById('paginationControls');
    const recordCount = document.getElementById('recordCount');
    
    recordCount.textContent = `${totalRecords} records`;

    if (totalPages <= 1) {
        controls.innerHTML = '';
        return;
    }

    let html = '';
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="goToPage(${currentPage - 1})">Previous</a>
            </li>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="goToPage(${i})">${i}</a>
                </li>`;
    }

    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="goToPage(${currentPage + 1})">Next</a>
            </li>`;

    controls.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadStudents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Add/Edit Student
// ============================================

function showAddStudent() {
    isEditing = false;
    document.getElementById('modalTitle').textContent = 'Add Student';
    document.getElementById('studentForm').reset();
    document.getElementById('editStudentId').value = '';
    document.getElementById('studentStatus').value = 'Active';
    document.getElementById('studentAdmissionDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('formError').classList.add('d-none');
    studentModal.show();
}

function editStudent(studentId) {
    const student = allStudents.find(s => s['Student ID'] === studentId);
    if (!student) {
        showToast('Student not found', 'danger');
        return;
    }

    isEditing = true;
    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('editStudentId').value = studentId;
    document.getElementById('studentName').value = student['Full Name'];
    document.getElementById('studentClass').value = student['Class'];
    document.getElementById('studentEmail').value = student['Parent Email'] || '';
    document.getElementById('studentPhone').value = student['Phone'] || '';
    document.getElementById('studentStatus').value = student['Status'] || 'Active';
    document.getElementById('studentAdmissionDate').value = student['Admission Date'] || '';
    document.getElementById('formError').classList.add('d-none');
    studentModal.show();
}

// js/admin-students.js - Updated saveStudent()
// ============================================

async function saveStudent() {
    const btn = document.getElementById('saveStudentBtn');
    const text = document.getElementById('saveBtnText');
    const spinner = document.getElementById('saveBtnSpinner');
    const errorDiv = document.getElementById('formError');

    // Get form data
    const studentId = document.getElementById('editStudentId').value;
    const fullName = document.getElementById('studentName').value.trim();
    const className = document.getElementById('studentClass').value;
    const parentEmail = document.getElementById('studentEmail').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    const status = document.getElementById('studentStatus').value;
    const admissionDate = document.getElementById('studentAdmissionDate').value;

    // Validate
    if (!fullName) {
        showFormError('Please enter student name');
        return;
    }
    if (!className) {
        showFormError('Please select a class');
        return;
    }

    // Show loading
    btn.disabled = true;
    text.classList.add('d-none');
    spinner.classList.remove('d-none');
    errorDiv.classList.add('d-none');

    try {
        const data = {
            fullName: fullName,
            className: className,
            parentEmail: parentEmail,
            phone: phone,
            status: status,
            admissionDate: admissionDate || new Date().toISOString().split('T')[0]
        };

        let result;
        if (studentId && isEditing) {
            // Update existing student
            data.studentId = studentId;
            console.log('📤 Updating student:', data);
            result = await api.call('updateStudent', data, 'POST');
            showToast('Student updated successfully!', 'success');
        } else {
            // Add new student
            console.log('📤 Adding student:', data);
            result = await api.call('addStudent', data, 'POST');
            showToast('Student added successfully!', 'success');
        }

        console.log('✅ Result:', result);
        studentModal.hide();
        loadStudents();

    } catch (error) {
        console.error('❌ Error saving student:', error);
        showFormError(error.message || 'Error saving student');
    } finally {
        btn.disabled = false;
        text.classList.remove('d-none');
        spinner.classList.add('d-none');
    }
}

function showFormError(message) {
    const errorDiv = document.getElementById('formError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
}

// ============================================
// Delete Student
// ============================================

function deleteStudent(studentId, studentName) {
    document.getElementById('deleteStudentId').value = studentId;
    document.getElementById('deleteStudentName').textContent = studentName;
    deleteModal.show();
}

// js/admin-students.js - Updated confirmDelete()
// ============================================

async function confirmDelete() {
    const btn = document.getElementById('confirmDeleteBtn');
    const text = document.getElementById('deleteBtnText');
    const spinner = document.getElementById('deleteBtnSpinner');
    const studentId = document.getElementById('deleteStudentId').value;

    btn.disabled = true;
    text.classList.add('d-none');
    spinner.classList.remove('d-none');

    try {
        console.log('📤 Deleting student:', studentId);
        const result = await api.call('deleteStudent', { studentId: studentId }, 'POST');
        console.log('✅ Result:', result);
        
        if (result.success) {
            showToast('Student deleted successfully!', 'success');
            deleteModal.hide();
            loadStudents();
        } else {
            showToast(result.error || 'Error deleting student', 'danger');
        }
    } catch (error) {
        console.error('❌ Error deleting student:', error);
        showToast('Error deleting student: ' + error.message, 'danger');
    } finally {
        btn.disabled = false;
        text.classList.remove('d-none');
        spinner.classList.add('d-none');
    }
}

// ============================================
// Export Students
// ============================================

async function exportStudents() {
    try {
        const students = allStudents.length > 0 ? allStudents : await api.getStudents();
        
        // Create CSV
        const headers = ['Student ID', 'Full Name', 'Class', 'Parent Email', 'Phone', 'Status', 'Admission Date'];
        let csv = headers.join(',') + '\n';
        
        students.forEach(s => {
            const row = [
                s['Student ID'],
                `"${s['Full Name']}"`,
                s['Class'],
                `"${s['Parent Email'] || ''}"`,
                `"${s['Phone'] || ''}"`,
                s['Status'],
                s['Admission Date'] || ''
            ];
            csv += row.join(',') + '\n';
        });

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Students exported successfully!', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error exporting students: ' + error.message, 'danger');
    }
}

// ============================================
// Import Students (Optional)
// ============================================

function importStudents() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // For now, show a message
        showToast('Import feature: Please use CSV format with headers: Student ID, Full Name, Class, Parent Email, Phone', 'info');
        // In a full implementation, you'd use a library like PapaParse for CSV parsing
    };
    input.click();
}

// ============================================
// Toast Notification
// ============================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toastMessage');
    const body = document.getElementById('toastBody');
    
    toast.className = `toast align-items-center text-white border-0 bg-${type}`;
    body.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// ============================================
// Logout
// ============================================

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}