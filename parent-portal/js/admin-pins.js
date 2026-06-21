// js/admin-pins.js
// ============================================
// Admin - PIN Management Logic
// ============================================

let allPins = [];
let printLabelsModal = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check admin session
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) {
        window.location.href = 'admin-login.html';
        return;
    }

    // Initialize modal
    printLabelsModal = new bootstrap.Modal(document.getElementById('printLabelsModal'));

    // Load PINs
    loadPins();
    loadPinStats();
});

// ============================================
// LOAD PIN DATA
// ============================================

async function loadPins() {
    try {
        const classFilter = document.getElementById('pinFilterClass').value;
        const statusFilter = document.getElementById('pinFilterStatus').value;
        const searchQuery = document.getElementById('pinSearchInput').value.toLowerCase();

        // Fetch all PINs
        let pins = [];
        if (classFilter) {
            const result = await api.getPinStatus(classFilter);
            pins = result.students || [];
        } else {
            // Get all classes
            const classes = await api.getClasses();
            for (const cls of classes) {
                const result = await api.getPinStatus(cls['Class Name']);
                if (result.students) {
                    pins = pins.concat(result.students);
                }
            }
        }

        allPins = pins;

        // Apply filters
        let filtered = pins;

        if (statusFilter) {
            filtered = filtered.filter(p => p['PIN Status'] === statusFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(p => 
                p['Full Name'].toLowerCase().includes(searchQuery) ||
                p['Student ID'].toLowerCase().includes(searchQuery) ||
                p['PIN'].toString().includes(searchQuery)
            );
        }

        renderPins(filtered);
        updateStats(pins);

    } catch (error) {
        console.error('Error loading PINs:', error);
        showToast('Error loading PINs: ' + error.message, 'danger');
    }
}

function renderPins(pins) {
    const tbody = document.getElementById('pinsBody');
    
    if (!pins || pins.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-key fa-2x d-block mb-2"></i>
                    No PINs found
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    pins.forEach((pin, index) => {
        const statusClass = pin['PIN Status'] === 'Active' ? 'pin-status-active' :
                           pin['PIN Status'] === 'Used' ? 'pin-status-used' :
                           'pin-status-revoked';

        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${pin['Student ID']}</td>
                <td><strong>${pin['Full Name']}</strong></td>
                <td>${pin['Class']}</td>
                <td><span class="badge bg-dark" style="font-family: monospace; font-size: 16px; letter-spacing: 2px;">${pin['PIN']}</span></td>
                <td>
                    <span class="pin-status-badge ${statusClass}">${pin['PIN Status']}</span>
                </td>
                <td>
                    ${pin['PIN Status'] === 'Active' ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="revokePin('${pin['Student ID']}')">
                            <i class="fas fa-ban"></i> Revoke
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="sharePin('${pin['Student ID']}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ============================================
// STATISTICS
// ============================================

function updateStats(pins) {
    const total = pins.length;
    const active = pins.filter(p => p['PIN Status'] === 'Active').length;
    const used = pins.filter(p => p['PIN Status'] === 'Used').length;
    const revoked = pins.filter(p => p['PIN Status'] === 'Revoked').length;

    document.getElementById('totalPins').textContent = total;
    document.getElementById('activePins').textContent = active;
    document.getElementById('usedPins').textContent = used;
    document.getElementById('revokedPins').textContent = revoked;
}

async function loadPinStats() {
    try {
        const result = await api.getPinStatus('');
        // Stats will be updated via loadPins()
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ============================================
// GENERATE PINS
// ============================================

async function generatePins() {
    const className = document.getElementById('pinClassSelect').value;
    const term = document.getElementById('pinTermSelect').value;

    if (!className) {
        showToast('Please select a class', 'warning');
        return;
    }

    const resultDiv = document.getElementById('generateResult');
    resultDiv.innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-spinner fa-spin"></i> Generating PINs for ${className}...
        </div>
    `;

    try {
        const result = await api.generatePins(className, term);
        
        if (result.success) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> 
                    ${result.message}
                    <br><small>${result.count} PINs generated</small>
                </div>
            `;
            loadPins();
            loadPinStats();
            showToast('PINs generated successfully!', 'success');
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> ${result.error}
                </div>
            `;
            showToast('Error generating PINs: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Error generating PINs:', error);
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> Error: ${error.message}
            </div>
        `;
        showToast('Error generating PINs: ' + error.message, 'danger');
    }
}

// ============================================
// REVOKE PIN
// ============================================

async function revokePin(studentId) {
    if (!confirm('Are you sure you want to revoke this PIN?')) {
        return;
    }

    try {
        const result = await api.revokePin(studentId);
        if (result.success) {
            showToast('PIN revoked successfully', 'success');
            loadPins();
            loadPinStats();
        } else {
            showToast('Error revoking PIN: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Error revoking PIN:', error);
        showToast('Error revoking PIN: ' + error.message, 'danger');
    }
}

// ============================================
// SHARE PIN
// ============================================

function sharePin(studentId) {
    const pin = allPins.find(p => p['Student ID'] === studentId);
    if (!pin) {
        showToast('PIN not found', 'danger');
        return;
    }

    const message = `🏫 ${CONFIG.SCHOOL_NAME}\n\n` +
                    `Student: ${pin['Full Name']}\n` +
                    `Class: ${pin['Class']}\n` +
                    `PIN: ${pin['PIN']}\n\n` +
                    `Visit: ${window.location.origin}/parent-portal/\n` +
                    `Enter your PIN to view the report.`;

    // WhatsApp
    if (navigator.share) {
        navigator.share({
            title: 'Student PIN',
            text: message
        }).catch(() => {});
    } else {
        // Fallback to copy to clipboard
        navigator.clipboard.writeText(message).then(() => {
            showToast('PIN copied to clipboard!', 'success');
        }).catch(() => {
            // Manual copy
            prompt('Copy this PIN message:', message);
        });
    }
}

// ============================================
// PRINT LABELS
// ============================================

async function printLabels() {
    const className = document.getElementById('pinFilterClass').value || 
                     document.getElementById('pinClassSelect').value;

    if (!className) {
        showToast('Please select a class first', 'warning');
        return;
    }

    const container = document.getElementById('labelsContainer');
    container.innerHTML = `
        <div class="text-center py-3">
            <i class="fas fa-spinner fa-spin"></i> Loading labels...
        </div>
    `;

    try {
        const result = await api.getPinStatus(className);
        const pins = result.students || [];

        if (pins.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-circle"></i> No PINs found for this class
                </div>
            `;
            return;
        }

        let html = `
            <div class="text-center mb-3">
                <h4>${CONFIG.SCHOOL_NAME}</h4>
                <p class="text-muted">Student PIN Labels - ${className}</p>
                <hr>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        `;

        pins.forEach(pin => {
            html += `
                <div class="pin-label">
                    <div style="font-size: 10px; color: #1a237e; font-weight: bold;">${CONFIG.SCHOOL_NAME}</div>
                    <div class="student-name">${pin['Full Name']}</div>
                    <div class="student-class">Class: ${pin['Class']}</div>
                    <div class="pin-number">${pin['PIN']}</div>
                    <div style="font-size: 8px; color: #999; margin-top: 5px;">
                        ${window.location.origin}/parent-portal/
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
        printLabelsModal.show();

    } catch (error) {
        console.error('Error loading labels:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> Error: ${error.message}
            </div>
        `;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function refreshData() {
    loadPins();
    loadPinStats();
    showToast('Data refreshed!', 'success');
}

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toastMessage');
    const body = document.getElementById('toastBody');
    
    toast.className = `toast align-items-center text-white border-0 bg-${type}`;
    body.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}