// js/admin-subjects.js
// ============================================
// Admin - Subject Management Logic
// ============================================

let allSubjects = [];
let subjectModal = null;
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
    subjectModal = new bootstrap.Modal(document.getElementById('subjectModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    // Load subjects
    loadSubjects();

    // Save button handler
    document.getElementById('saveSubjectBtn').addEventListener('click', saveSubject);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

// ============================================
// LOAD SUBJECTS
// ============================================

async function loadSubjects() {
    try {
        const classFilter = document.getElementById('subjectFilterClass').value;
        const searchQuery = document.getElementById('subjectSearchInput').value.toLowerCase();

        // Fetch subjects
        let subjects = await api.getSubjects();
        allSubjects = subjects;

        // Apply filters
        let filtered = subjects;

        if (classFilter) {
            filtered = filtered.filter(s => s['Class'] === classFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(s => 
                s['Subject Name'].toLowerCase().includes(searchQuery) ||
                s['Subject ID'].toLowerCase().includes(searchQuery)
            );
        }

        renderSubjects(filtered);

    } catch (error) {
        console.error('Error loading subjects:', error);
        showToast('Error loading subjects: ' + error.message, 'danger');
    }
}

function renderSubjects(subjects) {
    const tbody = document.getElementById('subjectsBody');
    
    if (!subjects || subjects.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-book fa-2x d-block mb-2"></i>
                    No subjects found
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    subjects.forEach((subject, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${subject['Subject ID']}</strong></td>
                <td>${subject['Subject Name']}</td>
                <td>${subject['Class']}</td>
                <td>${subject['Teacher ID'] || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editSubject('${subject['Subject ID']}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSubject('${subject['Subject ID']}', '${subject['Subject Name']}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ============================================
// ADD/EDIT SUBJECT
// ============================================

function showAddSubject() {
    isEditing = false;
    document.getElementById('modalTitle').textContent = 'Add Subject';
    document.getElementById('subjectForm').reset();
    document.getElementById('editSubjectId').value = '';
    document.getElementById('formError').classList.add('d-none');
    subjectModal.show();
}

function editSubject(subjectId) {
    const subject = allSubjects.find(s => s['Subject ID'] === subjectId);
    if (!subject) {
        showToast('Subject not found', 'danger');
        return;
    }

    isEditing = true;
    document.getElementById('modalTitle').textContent = 'Edit Subject';
    document.getElementById('editSubjectId').value = subjectId;
    document.getElementById('subjectName').value = subject['Subject Name'];
    document.getElementById('subjectClass').value = subject['Class'];
    document.getElementById('subjectTeacherId').value = subject['Teacher ID'] || '';
    document.getElementById('formError').classList.add('d-none');
    subjectModal.show();
}

async function saveSubject() {
    const btn = document.getElementById('saveSubjectBtn');
    const text = document.getElementById('saveBtnText');
    const spinner = document.getElementById('saveBtnSpinner');
    const errorDiv = document.getElementById('formError');

    const subjectId = document.getElementById('editSubjectId').value;
    const subjectName = document.getElementById('subjectName').value.trim();
    const subjectClass = document.getElementById('subjectClass').value;
    const teacherId = document.getElementById('subjectTeacherId').value.trim();

    if (!subjectName) {
        showFormError('Please enter subject name');
        return;
    }
    if (!subjectClass) {
        showFormError('Please select a class');
        return;
    }

    btn.disabled = true;
    text.classList.add('d-none');
    spinner.classList.remove('d-none');
    errorDiv.classList.add('d-none');

    try {
        const data = {
            subjectName: subjectName,
            class: subjectClass,
            teacherId: teacherId
        };

        let result;
        if (subjectId && isEditing) {
            data.subjectId = subjectId;
            result = await api.call('updateSubject', data);
            showToast('Subject updated successfully!', 'success');
        } else {
            result = await api.call('addSubject', data);
            showToast('Subject added successfully!', 'success');
        }

        console.log('✅ Result:', result);
        subjectModal.hide();
        loadSubjects();

    } catch (error) {
        console.error('❌ Error saving subject:', error);
        showFormError(error.message || 'Error saving subject');
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
// DELETE SUBJECT
// ============================================

function deleteSubject(subjectId, subjectName) {
    document.getElementById('deleteSubjectId').value = subjectId;
    document.getElementById('deleteSubjectName').textContent = subjectName;
    deleteModal.show();
}

async function confirmDelete() {
    const btn = document.getElementById('confirmDeleteBtn');
    const text = document.getElementById('deleteBtnText');
    const spinner = document.getElementById('deleteBtnSpinner');
    const subjectId = document.getElementById('deleteSubjectId').value;

    btn.disabled = true;
    text.classList.add('d-none');
    spinner.classList.remove('d-none');

    try {
        const result = await api.call('deleteSubject', { subjectId: subjectId });
        
        if (result.success) {
            showToast('Subject deleted successfully!', 'success');
            deleteModal.hide();
            loadSubjects();
        } else {
            showToast(result.error || 'Error deleting subject', 'danger');
        }
    } catch (error) {
        console.error('Error deleting subject:', error);
        showToast('Error deleting subject: ' + error.message, 'danger');
    } finally {
        btn.disabled = false;
        text.classList.remove('d-none');
        spinner.classList.add('d-none');
    }
}

// ============================================
// TOAST NOTIFICATION
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
// LOGOUT
// ============================================

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}