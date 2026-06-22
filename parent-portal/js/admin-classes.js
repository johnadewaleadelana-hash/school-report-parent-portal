// js/admin-classes.js
// ============================================
// Admin - Class Management Logic
// ============================================

let allClasses = [];
let classModal = null;
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
    classModal = new bootstrap.Modal(document.getElementById('classModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    // Load classes
    loadClasses();

    // Save button handler
    document.getElementById('saveClassBtn').addEventListener('click', saveClass);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

// ============================================
// LOAD CLASSES
// ============================================

async function loadClasses() {
    try {
        const classes = await api.getClasses();
        allClasses = classes;
        renderClasses(classes);
    } catch (error) {
        console.error('Error loading classes:', error);
        showToast('Error loading classes: ' + error.message, 'danger');
    }
}

function renderClasses(classes) {
    const tbody = document.getElementById('classesBody');
    
    if (!classes || classes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="fas fa-users fa-2x d-block mb-2"></i>
                    No classes found
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    classes.forEach((cls, index) => {
        const statusBadge = cls['Is Active'] === 'Yes' ? 
            '<span class="badge bg-success">Active</span>' : 
            '<span class="badge bg-secondary">Inactive</span>';

        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${cls['Class ID']}</strong></td>
                <td>${cls['Class Name']}</td>
                <td>${cls['Next Class'] || '-'}</td>
                <td>${cls['Promotion Average'] || '-'}</td>
                <td>${cls['Min Subjects Pass'] || '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editClass('${cls['Class ID']}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteClass('${cls['Class ID']}', '${cls['Class Name']}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ============================================
// ADD/EDIT CLASS
// ============================================

function showAddClass() {
    isEditing = false;
    document.getElementById('modalTitle').textContent = 'Add Class';
    document.getElementById('classForm').reset();
    document.getElementById('editClassId').value = '';
    document.getElementById('promotionAvg').value = '50';
    document.getElementById('minSubjectsPass').value = '5';
    document.getElementById('classStatus').value = 'Yes';
    document.getElementById('formError').classList.add('d-none');
    classModal.show();
}

function editClass(classId) {
    const cls = allClasses.find(c => c['Class ID'] === classId);
    if (!cls) {
        showToast('Class not found', 'danger');
        return;
    }

    isEditing = true;
    document.getElementById('modalTitle').textContent = 'Edit Class';
    document.getElementById('editClassId').value = classId;
    document.getElementById('className').value = cls['Class Name'];
    document.getElementById('nextClass').value = cls['Next Class'] || '';
    document.getElementById('promotionAvg').value = cls['Promotion Average'] || '50';
    document.getElementById('minSubjectsPass').value = cls['Min Subjects Pass'] || '5';
    document.getElementById('classStatus').value = cls['Is Active'] || 'Yes';
    document.getElementById('formError').classList.add('d-none');
    classModal.show();
}

async function saveClass() {
    const btn = document.getElementById('saveClassBtn');
    const text = document.getElementById('saveBtnText');
    const spinner = document.getElementById('saveBtnSpinner');
    const errorDiv = document.getElementById('formError');

    const classId = document.getElementById('editClassId').value;
    const className = document.getElementById('className').value.trim();
    const nextClass = document.getElementById('nextClass').value.trim();
    const promotionAvg = document.getElementById('promotionAvg').value;
    const minSubjectsPass = document.getElementById('minSubjectsPass').value;
    const isActive = document.getElementById('classStatus').value;

    if (!className) {
        showFormError('Please enter class name');
        return;
    }

    btn.disabled = true;
    text.classList.add('d-none');
    spinner.classList.remove('d-none');
    errorDiv.classList.add('d-none');

    try {
        const data = {
            className: className,
            nextClass: nextClass,
            promotionAvg: promotionAvg,
            minSubjectsPass: minSubjectsPass,
            isActive: isActive
        };

        let result;
        if (classId && isEditing) {
            data.classId = classId;
            result = await api.call('updateClass', data);
            showToast('Class updated successfully!', 'success');
        } else {
            result = await api.call('addClass', data);
            showToast('Class added successfully!', 'success');
        }

        console.log('✅ Result:', result);
        classModal.hide();
        loadClasses();

    } catch (error) {
        console.error('❌ Error saving class:', error);
        showFormError(error.message || 'Error saving class');
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
// DELETE CLASS
// ============================================

function deleteClass(classId, className) {
    document.getElementById('deleteClassId').value = classId;
    document.getElementById('deleteClassName').textContent = className;
    deleteModal.show();
}

async function confirmDelete() {
    const btn = document.getElementById('confirmDeleteBtn');
    const text = document.getElementById('deleteBtnText');
    const spinner = document.getElementById('deleteBtnSpinner');
    const classId = document.getElementById('deleteClassId').value;

    btn.disabled = true;
    text.classList.add('d-none');
    spinner.classList.remove('d-none');

    try {
        const result = await api.call('deleteClass', { classId: classId });
        
        if (result.success) {
            showToast('Class deleted successfully!', 'success');
            deleteModal.hide();
            loadClasses();
        } else {
            showToast(result.error || 'Error deleting class', 'danger');
        }
    } catch (error) {
        console.error('Error deleting class:', error);
        showToast('Error deleting class: ' + error.message, 'danger');
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