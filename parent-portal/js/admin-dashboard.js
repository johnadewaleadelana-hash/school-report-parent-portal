// js/admin-dashboard.js
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    try {
        await loadStats();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
});

// js/admin-dashboard.js - Updated loadStats()
// ============================================

async function loadStats() {
    try {
        // Get students
        const students = await api.getStudents();
        document.getElementById('totalStudents').textContent = students.length || 0;
        
        // Get teachers
        const teachers = await api.getTeachers();
        document.getElementById('totalTeachers').textContent = teachers.length || 0;
        
        // Get subjects
        const subjects = await api.getSubjects();
        document.getElementById('totalSubjects').textContent = subjects.length || 0;
        
        // Get classes
        const classes = await api.getClasses();
        document.getElementById('totalClasses').textContent = classes.length || 0;
        
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('totalStudents').textContent = 'Error';
    }
}

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}

async function refreshData() {
    document.querySelector('.btn-outline-dark i').className = 'fas fa-spinner fa-spin';
    await loadStats();
    document.querySelector('.btn-outline-dark i').className = 'fas fa-sync';
}