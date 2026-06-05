/* ==========================================================================
   AuraHR Enterprise Suite — Core Cloud Runtime Engine
   UI v2: Premium HRMS · All AWS integrations preserved
   ========================================================================== */

// ── Global API Gateway Production Endpoint Configuration ──────────────────
const API_BASE_URL = "https://zajt2pmqt2.execute-api.ap-south-1.amazonaws.com/prod";

const ENDPOINTS = {
    CREATE_LEAVE:  `${API_BASE_URL}/leave-v2`,
    GET_ALL:       `${API_BASE_URL}/requests-v2`,
    GET_MY:        `${API_BASE_URL}/my-requests-v2`,
    UPDATE_STATUS: `${API_BASE_URL}/update-status-v2`
};

// ── Filter state for manager table ───────────────────────────────────────
let activeFilter = 'all';
let allRequestsCache = [];


/* ═══════════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
═══════════════════════════════════════════════════════════════════════════ */
let toastTimer = null;

function showToast(message, type = 'info', duration = 3500) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // Icon map
    const icons = {
        success: '<i class="fa-solid fa-circle-check"></i>',
        error:   '<i class="fa-solid fa-circle-xmark"></i>',
        info:    '<i class="fa-solid fa-circle-info"></i>',
        approve: '<i class="fa-solid fa-circle-check"></i>',
        reject:  '<i class="fa-solid fa-circle-xmark"></i>',
    };

    toast.innerHTML = (icons[type] || icons.info) + `<span>${message}</span>`;
    toast.className = `toast toast-${type} show`;

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}


/* ═══════════════════════════════════════════════════════════════════════════
   ROUTING / VIEW MANAGEMENT
═══════════════════════════════════════════════════════════════════════════ */
function switchView(targetScreenId) {
    const screens = ['homeScreen', 'employeeScreen', 'managerLoginScreen', 'managerScreen'];
    screens.forEach(screenId => {
        const el = document.getElementById(screenId);
        if (!el) return;
        if (screenId === targetScreenId) {
            el.classList.remove('hidden');
            el.classList.add('active');
        } else {
            el.classList.add('hidden');
            el.classList.remove('active');
        }
    });
}

function showEmployeePortal() {
    switchView('employeeScreen');
}

function showManagerLogin() {
    const pwdInput = document.getElementById('managerPassword');
    if (pwdInput) pwdInput.value = '';
    switchView('managerLoginScreen');
}

function goHome() {
    switchView('homeScreen');
    // Reset manager state
    activeFilter = 'all';
    allRequestsCache = [];
}


/* ═══════════════════════════════════════════════════════════════════════════
   PASSWORD TOGGLE
═══════════════════════════════════════════════════════════════════════════ */
function togglePassword() {
    const input = document.getElementById('managerPassword');
    const icon  = document.getElementById('pwdIcon');
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   ACTION 1 — SUBMIT LEAVE REQUEST
═══════════════════════════════════════════════════════════════════════════ */
async function submitLeave() {
    const name     = document.getElementById('employeeName').value.trim();
    const email    = document.getElementById('employeeEmail').value.trim();
    const type     = document.getElementById('leaveType').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate   = document.getElementById('toDate').value;
    const reason   = document.getElementById('reason').value.trim();

    if (!name || !email || !fromDate || !toDate || !reason) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    const payload = {
        "EmployeeName":  name,
        "EmployeeEmail": email,
        "LeaveType":     type,
        "FromDate":      fromDate,
        "ToDate":        toDate,
        "Reason":        reason
    };

    // Loading state
    const btn = document.getElementById('submitBtn');
    setButtonLoading(btn, true, 'Submitting...');

    try {
        const response = await fetch(ENDPOINTS.CREATE_LEAVE, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('Leave request submitted successfully!', 'success');
            document.getElementById('fromDate').value = '';
            document.getElementById('toDate').value   = '';
            document.getElementById('reason').value   = '';
            loadMyRequests();
        } else {
            throw new Error(`Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('Submit leave failed:', error);
        showToast('Failed to submit request. Please try again.', 'error');
    } finally {
        setButtonLoading(btn, false, null, '<i class="fa-solid fa-paper-plane"></i><span>Submit Request</span>');
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   ACTION 2 — LOAD MY REQUESTS (Employee)
═══════════════════════════════════════════════════════════════════════════ */
async function loadMyRequests() {
    const email = document.getElementById('employeeEmail').value.trim();
    if (!email) {
        showToast('Enter your email address to load requests.', 'info');
        return;
    }

    const container = document.getElementById('myRequests');

    // Show loading state
    container.innerHTML = `
        <div class="fetching-state">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Loading your requests...</span>
        </div>
    `;

    // Button loading state
    const btn = document.getElementById('viewRequestsBtn');
    setButtonLoading(btn, true, 'Loading...');

    try {
        const response = await fetch(`${ENDPOINTS.GET_MY}?email=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();
        container.innerHTML = '';

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-inbox"></i></div>
                    <p class="empty-title">No requests found</p>
                    <p class="empty-desc">No leave requests linked to this email address.</p>
                </div>
            `;
            return;
        }

        data.forEach((item, index) => {
            const statusClass = getStatusClass(item.Status);
            const statusLabel = item.Status || 'Pending';

            const card = document.createElement('div');
            card.className = 'request-card';
            card.style.animationDelay = `${index * 0.06}s`;

            card.innerHTML = `
                <div class="request-card-header">
                    <span class="request-leave-type">${item.LeaveType || 'Leave Request'}</span>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </div>
                <div class="request-card-meta">
                    <div class="request-meta-row">
                        <i class="fa-solid fa-calendar-range"></i>
                        <span>${formatDate(item.FromDate)} &rarr; ${formatDate(item.ToDate)}</span>
                    </div>
                </div>
                <div class="request-reason">"${item.Reason || 'No reason provided.'}"</div>
                <div class="request-id">ID: ${item.RequestID || 'N/A'}</div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Load my requests failed:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <p class="empty-title">Failed to load</p>
                <p class="empty-desc">Could not fetch requests. Please try again.</p>
            </div>
        `;
    } finally {
        setButtonLoading(btn, false, null, '<i class="fa-solid fa-clock-rotate-left"></i><span>View My Requests</span>');
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   ACTION 3 — MANAGER LOGIN
═══════════════════════════════════════════════════════════════════════════ */
function loginManager() {
    const pwd = document.getElementById('managerPassword').value;
    const btn = document.getElementById('loginBtn');

    if (pwd === "admin123") {
        setButtonLoading(btn, true, 'Signing in...');
        setTimeout(() => {
            switchView('managerScreen');
            loadAllRequests();
            setButtonLoading(btn, false, null, '<i class="fa-solid fa-right-to-bracket"></i><span>Sign In</span>');
        }, 600);
    } else {
        showToast('Incorrect password. Please try again.', 'error');
        const input = document.getElementById('managerPassword');
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   ACTION 4 — LOAD ALL REQUESTS (Manager)
═══════════════════════════════════════════════════════════════════════════ */
async function loadAllRequests() {
    const tableBody = document.getElementById('requestsTable');
    const refreshBtn = document.getElementById('refreshIcon');

    // Spinning refresh icon
    if (refreshBtn) refreshBtn.closest('.btn-icon-outline').classList.add('spinning');

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="loading-cell">
                <div class="table-loader">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Loading requests...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const response = await fetch(ENDPOINTS.GET_ALL);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();
        allRequestsCache = data || [];

        // Update stats
        updateStats(allRequestsCache);

        // Render table
        renderTable(allRequestsCache);

    } catch (error) {
        console.error('Load all requests failed:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">
                    <div class="table-loader" style="color: #be123c;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>Failed to load. Check your connection and try again.</span>
                    </div>
                </td>
            </tr>
        `;
        showToast('Failed to fetch requests from server.', 'error');
    } finally {
        if (refreshBtn) refreshBtn.closest('.btn-icon-outline').classList.remove('spinning');
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   STATS CALCULATION
═══════════════════════════════════════════════════════════════════════════ */
function updateStats(data) {
    const total    = data.length;
    const pending  = data.filter(r => (r.Status || '').toLowerCase() === 'pending').length;
    const approved = data.filter(r => (r.Status || '').toLowerCase() === 'approved').length;
    const rejected = data.filter(r => (r.Status || '').toLowerCase() === 'rejected').length;

    animateCount('statTotal',    total);
    animateCount('statPending',  pending);
    animateCount('statApproved', approved);
    animateCount('statRejected', rejected);
}

function animateCount(elId, target) {
    const el = document.getElementById(elId);
    if (!el) return;
    let current = 0;
    const step  = Math.ceil(target / 20);
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
    }, 35);
}


/* ═══════════════════════════════════════════════════════════════════════════
   TABLE RENDER
═══════════════════════════════════════════════════════════════════════════ */
function renderTable(data) {
    const tableBody = document.getElementById('requestsTable');
    tableBody.innerHTML = '';

    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    let filtered = data;

    // Apply status filter
    if (activeFilter !== 'all') {
        filtered = filtered.filter(r => (r.Status || 'Pending').toLowerCase() === activeFilter);
    }

    // Apply search
    if (search) {
        filtered = filtered.filter(r =>
            (r.EmployeeName  || '').toLowerCase().includes(search) ||
            (r.EmployeeEmail || '').toLowerCase().includes(search)
        );
    }

    if (!filtered || filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">
                    <div class="table-loader">
                        <i class="fa-solid fa-search"></i>
                        <span>No requests match your current filters.</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach((item, index) => {
        const tr = document.createElement('tr');
        const statusClass = getStatusClass(item.Status);
        const statusLabel = item.Status || 'Pending';
        const initials    = getInitials(item.EmployeeName);

        // Action buttons
        let actionMarkup;
        if ((item.Status || 'Pending').toLowerCase() === 'pending') {
            actionMarkup = `
                <div class="action-btns">
                    <button class="btn-approve" onclick="updateStatus('${item.RequestID}', 'Approved')">
                        <i class="fa-solid fa-check"></i> Approve
                    </button>
                    <button class="btn-reject" onclick="updateStatus('${item.RequestID}', 'Rejected')">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                </div>
            `;
        } else {
            actionMarkup = `
                <span class="evaluated-badge">
                    <i class="fa-solid fa-lock"></i> Evaluated
                </span>
            `;
        }

        tr.innerHTML = `
            <td>
                <div class="employee-cell">
                    <div class="employee-avatar">${initials}</div>
                    <div>
                        <div class="employee-name">${item.EmployeeName || 'N/A'}</div>
                        <div class="employee-email">${item.EmployeeEmail || ''}</div>
                    </div>
                </div>
            </td>
            <td><span class="leave-badge">${item.LeaveType || 'Casual Leave'}</span></td>
            <td>
                <div class="duration-cell">
                    <span>${formatDate(item.FromDate)}</span>
                    <i class="fa-solid fa-arrow-right duration-arrow"></i>
                    <span>${formatDate(item.ToDate)}</span>
                </div>
            </td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td class="action-cell">${actionMarkup}</td>
        `;

        // Staggered row animation
        tr.style.opacity = '0';
        tr.style.transform = 'translateY(6px)';
        tr.style.transition = `opacity 0.25s ease ${index * 0.04}s, transform 0.25s ease ${index * 0.04}s`;

        tableBody.appendChild(tr);

        // Trigger animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                tr.style.opacity = '1';
                tr.style.transform = 'translateY(0)';
            });
        });
    });
}


/* ═══════════════════════════════════════════════════════════════════════════
   SEARCH & FILTER
═══════════════════════════════════════════════════════════════════════════ */
function setFilter(filter, btn) {
    activeFilter = filter;

    // Update tab active state
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    renderTable(allRequestsCache);
}

function filterTable() {
    renderTable(allRequestsCache);
}


/* ═══════════════════════════════════════════════════════════════════════════
   ACTION 5 — UPDATE STATUS (Approve / Reject)
═══════════════════════════════════════════════════════════════════════════ */
async function updateStatus(requestId, status) {
    if (!requestId) {
        showToast('Invalid request ID.', 'error');
        return;
    }

    const payload = {
        "RequestID": requestId,
        "Status":    status
    };

    // Show updating toast
    showToast(`Updating status to ${status}...`, 'info', 10000);

    try {
        const response = await fetch(ENDPOINTS.UPDATE_STATUS, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });

        if (response.ok) {
            // Re-fetch to get fresh data
            await loadAllRequests();

            if (status === 'Approved') {
                showToast('✅ Request approved! Email notification sent.', 'approve');
            } else {
                showToast('Request rejected. Employee has been notified.', 'reject');
            }
        } else {
            throw new Error(`Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('Update status failed:', error);
        showToast('Failed to update status. Please try again.', 'error');
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY HELPERS
═══════════════════════════════════════════════════════════════════════════ */

/** Map status string to CSS class */
function getStatusClass(status) {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'approved') return 'status-approved';
    if (s === 'rejected') return 'status-rejected';
    return 'status-pending';
}

/** Extract initials from a name */
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
}

/** Format ISO date to readable format */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

/** Set a button into loading/normal state */
function setButtonLoading(btn, isLoading, loadingText, normalHTML) {
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i><span>${loadingText || 'Loading...'}</span>`;
    } else {
        btn.disabled = false;
        if (normalHTML) btn.innerHTML = normalHTML;
    }
}