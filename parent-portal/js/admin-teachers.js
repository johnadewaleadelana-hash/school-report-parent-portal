// js/admin-teachers.js
// ============================================
// Admin - Teacher Management Logic
// ============================================

let allTeachers = [];
let teacherModal = null;
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
    teacherModal = new bootstrap.Modal(document.getElementById('teacherModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    // Load teachers
    loadTeachers();

    // Save button handler
    document.getElementById('saveTeacherBtn').addEventListener('click', saveTeacher);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

// ============================================
// LOAD TEACHERS
// ============================================

async function loadTeachers() {
    try {
        const classFilter = document.getElementById('teacherFilterClass').value;
        const searchQuery = document.getElementById('teacherSearchInput').value.toLowerCase();

        // Fetch teachers
        let teachers = await api.getTeachers();
        allTeachers = teachers;

        // Apply filters
        let filtered = teachers;

        if (classFilter) {
            filtered = filtered.filter(t => t['Class Assigned'] === classFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(t => 
                t['Full Name'].toLowerCase().includes(searchQuery) ||
                t['Teacher ID'].toLowerCase().includes(searchQuery) ||
                t['Email'].toLowerCase().includes(searchQuery)
            );
        }

        renderTeachers(filtered);

    } catch (error) {
        console.error('Error loading teachers:', error);
        showToast('Error loading teachers: ' + error.message, 'danger');
    }
}

function renderTeachers(teachers) {
    const tbody = document.getElementById('teachersBody');
    
    if (!teachers || teachers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="fas fa-chalkboard-teacher fa-2x d-block mb-2"></i>
                    No teachers found
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    teachers.forEach((teacher, index) => {
        const roleBadge = teacher['Role'] === 'admin' ? 'bg-warning' :
                         teacher['Role'] === 'super_admin' ? 'bg-danger' : 'bg-primary';

        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${teacher['Teacher ID']}</strong></td>
                <td>${teacher['Full Name']}</td>
                <td>${teacher['Email']}</td>
                <td>${teacher['Class Assigned'] || '-'}</td>
                <td><small>${teacher['Subjects'] || '-'}</small></td>
                <td><span class="badge ${roleBadge}">${teacher['Role']}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editTeacher('${teacher['Teacher ID']}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTeacher('${teacher['Teacher ID']}', '${teacher['Full Name']}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ============================================
// ADD/EDIT TEACHER
// ============================================

function showAddTeacher() {
    isEditing = false;
    document.getElementById('modalTitle').textContent = 'Add Teacher';
    document.getElementById('teacherForm').reset();
    document.getElementById('editTeacherId').value = '';
    document.getElementById('teacherRole').value = 'teacher';
    document.getElementById('teacherIsTutor').value = 'No';
    document.getElementById('teacherPassword').value = 'teacher123';
    document.getElementById('formError').classList.add('d-none');
    teacherModal.show();
}

function editTeacher(teacherId) {
    const teacher = allTeachers.find(t => t['Teacher ID'] === teacherId);
    if (!teacher) {
        showToast('Teacher not found', 'danger');
        return;
    }

    isEditing = true;
    document.getElementById('modalTitle').textContent = 'Edit Teacher';
    document.getElementById('editTeacherId').value = teacherId;
    document.getElementById('teacherName').value = teacher['Full Name'];
    document.getElementById('teacherEmail').value = teacher['Email'];
    document.getElementById('teacherPhone').value = teacher['Phone'] || '';
    document.getElementById('teacherClass').value = teacher['Class Assigned'] || '';
    document.getElementById('teacherSubjects').value = teacher['Subjects'] || '';
    document.getElementById('teacherRole').value = teacher['Role'] || 'teacher';
    document.getElementById('teacherIsTutor').value = teacher['Is Tutor'] || 'No';
    document.getElementById('teacherPassword').value = '';
    document.getElementById('formError').classList.add('d-none');
    teacherModal.show();
}

async function saveTeacher() {
    const btn = document.getElementById('saveTeacherBtn');
    const text = document.getElementById('saveBtnText');
    const spinner = document.getElementById('saveBtnSpinner');
    const errorDiv = document.getElementById('formError');

    const teacherId = document.getElementById('editTeacherId').value;
    const fullName = document.getElementById('teacherName').value.trim();
    const email = document.getElementById('teacherEmail').value.trim();
    const phone = document.getElementById('teacherPhone').value.trim();
    const classAssigned = document.getElementById('teacherClass').value;
    const subjects = document.getElementById('teacherSubjects').value.trim();
    const role = document.getElementById('teacherRole').value;
    const isTutor = document.getElementById('teacherIsTutor').value;
    const password = document.getElementById('teacherPassword').value.trim();

    if (!fullName) {
        showFormError('Please enter teacher name');
        return;
    }
    if (!email) {
        showFormError('Please enter teacher email');
        return;
    }

    btn.disabled = true;
    text.classList.add('d-none');
    spinner.classList.remove('d-none');
    errorDiv.classList.add('d-none');

    try {
        const data = {
            fullName: fullName,
            email: email,
            phone: phone,
            classAssigned: classAssigned,
            subjects: subjects,
            role: role,
            isTutor: isTutor
        };

        if (password) {
            data.password = password;
        }

        let result;
        if (teacherId && isEditing) {
            data.teacherId = teacherId;
            result = await api.call('updateTeacher', data);
            showToast('Teacher updated successfully!', 'success');
        } else {
            data.password = password || 'teacher123';
            result = await api.call('addTeacher', data);
            showToast('Teacher added successfully!', 'success');
        }

        console.log('✅ Result:', result);
        teacherModal.hide();
        loadTeachers();

    } catch (error) {
        console.error('❌ Error saving teacher:', error);
        showFormError(error.message || 'Error saving teacher');
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
// DELETE TEACHER
// ============================================

function deleteTeacher(teacherId, teacherName) {
    document.getElementById('deleteTeacherId').value = teacherId;
    document.getElementById('deleteTeacherName').textContent = teacherName;
    deleteModal.show();
}

async function confirmDelete() {
    const btn = document.getElementById('confirmDeleteBtn');
    const text = document.getElementById('deleteBtnText');
    const spinner = document.getElementById('deleteBtnSpinner');
    const teacherId = document.getElementById('deleteTeacherId').value;

    btn.disabled = true;
    text.classList.add('d-none');
    spinner.classList.remove('d-none');

    try {
        const result = await api.call('deleteTeacher', { teacherId: teacherId });
        
        if (result.success) {
            showToast('Teacher deleted successfully!', 'success');
            deleteModal.hide();
            loadTeachers();
        } else {
            showToast(result.error || 'Error deleting teacher', 'danger');
        }
    } catch (error) {
        console.error('Error deleting teacher:', error);
        showToast('Error deleting teacher: ' + error.message, 'danger');
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