/**
 * StreakMate AJAX Operations
 * Interacts with Django REST API endpoints
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api/habits';
const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    fetchHabits();
    loadCurrentUser();

    const form = document.getElementById('createHabitForm');
    if (form) {
        form.addEventListener('submit', handleCreateHabit);
    }

    const freqSelect = document.getElementById('habitFreq');
    if (freqSelect) {
        freqSelect.addEventListener('change', updateGoalUI);
        updateGoalUI();
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});
/**
 * Screen reader announcer for Accessibility
 */
function announceMessage(msg) {
    const announcer = document.getElementById('aria-announcer');
    if (announcer) announcer.textContent = msg;
}

/**
 * Show message inside page instead of only alert()
 */
function showMessage(message, type = 'success') {
    const box = document.getElementById('messageBox');
    if (!box) {
        alert(message);
        return;
    }

    box.className = `alert alert-${type}`;
    box.textContent = message;
    box.classList.remove('d-none');

    setTimeout(() => {
        box.classList.add('d-none');
    }, 3000);

    announceMessage(message);
}

/**
 * Toggle goal input based on frequency
 */
function updateGoalUI() {
    const freq = document.getElementById('habitFreq').value;
    const goalSection = document.getElementById('goalSection');
    const goalInput = document.getElementById('habitGoal');
    const dailyInfoBox = document.getElementById('dailyInfoBox');

    if (freq === 'daily') {
        goalSection.classList.add('d-none');
        dailyInfoBox.classList.remove('d-none');
        goalInput.value = 1;
    } else {
        goalSection.classList.remove('d-none');
        dailyInfoBox.classList.add('d-none');

        if (!goalInput.value || Number(goalInput.value) < 1) {
            goalInput.value = 3;
        }
    }
}

/**
 * Escape single quotes in title for inline onclick
 */
function escapeTitle(title) {
    return String(title).replace(/'/g, "\\'");
}

/**
 * Handle unauthenticated API responses
 */
function handleAuthFailure(response) {
    if (response.status === 401) {
        window.location.assign('http://127.0.0.1:5500/frontend/login.html');
        return true;
    }
    return false;
}

async function loadCurrentUser() {
    const welcomeText = document.getElementById('welcomeText');
    if (!welcomeText) return;

    try {
        const response = await fetch('http://127.0.0.1:8000/api/me/', {
            credentials: 'include'
        });

        if (response.status === 401) {
            welcomeText.textContent = 'Welcome';
            return;
        }

        const result = await response.json();

        if (result.success && result.username) {
            welcomeText.textContent = `Welcome, ${result.username}`;
        } else {
            welcomeText.textContent = 'Welcome';
        }
    } catch (err) {
        console.error('Load Current User Error:', err);
        welcomeText.textContent = 'Welcome';
    }
}
/**
 * Render one habit card
 */
function renderHabitCard(habit) {
    const isDaily = habit.frequency === 'daily';
    const isWeekly = habit.frequency === 'weekly';

    let statusBadges = `
        <span class="badge bg-primary-subtle text-primary border border-primary-subtle text-capitalize">${habit.frequency}</span>
    `;

    if (isDaily) {
        statusBadges += habit.done_today
            ? `<span class="badge bg-success-subtle text-success border border-success-subtle">Completed Today</span>`
            : `<span class="badge bg-light text-dark border">Not completed today</span>`;
    }

    if (isWeekly) {
        statusBadges += `
            <span class="badge bg-info-subtle text-info border border-info-subtle">Target: ${habit.goal_per_week}/week</span>
            <span class="badge bg-warning-subtle text-warning border border-warning-subtle">This week: ${habit.weekly_progress || 0}/${habit.goal_per_week}</span>
        `;

        if ((habit.weekly_progress || 0) >= habit.goal_per_week) {
            statusBadges += `<span class="badge bg-success-subtle text-success border border-success-subtle">Goal reached</span>`;
        }
    }

    let actionButton = '';

    if (isDaily) {
        actionButton = habit.done_today
            ? `
                <button class="btn btn-success btn-sm" disabled>
                    ✔ Completed Today
                </button>
            `
            : `
                <button onclick="checkInHabit(${habit.id}, '${escapeTitle(habit.title)}')" class="btn btn-outline-success btn-sm">
                    ✔ Mark as Done Today
                </button>
            `;
    }

    if (isWeekly) {
        actionButton = `
            <button onclick="checkInHabit(${habit.id}, '${escapeTitle(habit.title)}')" class="btn btn-outline-success btn-sm">
                ＋ Add 1 Weekly Progress
            </button>
        `;
    }

    return `
        <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
                <h5 class="card-title fw-bold text-dark">${habit.title}</h5>
                <p class="card-text text-secondary mb-3">${habit.description || 'No description provided'}</p>

                <div class="d-flex flex-wrap gap-2 mb-3">
                    ${statusBadges}
                </div>

                <div class="d-grid gap-2">
                    ${actionButton}
                    <button onclick="deleteHabit(${habit.id}, '${escapeTitle(habit.title)}')" class="btn btn-outline-danger btn-sm">
                        Delete Habit
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * GET: Retrieve habits list and render to UI
 */
async function fetchHabits() {
    const container = document.getElementById('habitList');

    try {
        const response = await fetch(`${API_BASE_URL}/`, {
            credentials: 'include'
        });

        if (handleAuthFailure(response)) return;

        const data = await response.json();

        container.innerHTML = '';

        if (data.habits && data.habits.length > 0) {
            data.habits.forEach(habit => {
                const col = document.createElement('div');
                col.className = 'col-md-6';
                col.innerHTML = renderHabitCard(habit);
                container.appendChild(col);
            });
            announceMessage('Successfully updated habit list.');
        } else {
            container.innerHTML = `
                <div class="col-12 text-center p-5">
                    <p class="text-muted">No active habits found. Start by creating one!</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('Fetch Error:', err);
        container.innerHTML = `<div class="alert alert-danger">Error: Could not connect to backend server.</div>`;
    }
}

/**
 * POST: Create a new habit via AJAX
 */
async function handleCreateHabit(event) {
    event.preventDefault();

    const frequency = document.getElementById('habitFreq').value;
    let goal = 1;

    if (frequency === 'weekly') {
        goal = parseInt(document.getElementById('habitGoal').value, 10) || 1;
    }

    const payload = {
        title: document.getElementById('habitTitle').value.trim(),
        description: document.getElementById('habitDesc').value.trim(),
        frequency: frequency,
        goal_per_week: goal
    };

    if (!payload.title) {
        showMessage('Habit title is required.', 'warning');
        return;
    }

    if (frequency === 'weekly' && goal < 1) {
        showMessage('Weekly target must be at least 1.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/create/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (handleAuthFailure(response)) return;

        const result = await response.json();

        if (response.ok) {
            showMessage('Great! Your new habit has been added.', 'success');
            document.getElementById('createHabitForm').reset();
            updateGoalUI();
            fetchHabits();
        } else {
            const errorMsg = result.error || 'Server error';

            if (errorMsg.includes('already exists')) {
                showMessage('You already have a habit with this title. Please use a different habit name.', 'warning');
            } else {
                showMessage('Failed to save habit: ' + errorMsg, 'danger');
            }
        }
    } catch (err) {
        console.error('Submission Error:', err);
        showMessage('Critical error connecting to the server.', 'danger');
    }
}

/**
 * POST: Record habit progress
 */
async function checkInHabit(habitId, habitTitle) {
    const today = new Date().toISOString().split('T')[0];

    const payload = {
        date: today,
        note: 'Check-in from Web Frontend'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/${habitId}/checkin/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (handleAuthFailure(response)) return;

        const result = await response.json();

        if (response.ok) {
            const msg = `Progress recorded for ${habitTitle}!`;
            showMessage(msg, 'success');
            fetchHabits();
        } else {
            showMessage('Could not complete progress update: ' + (result.error || 'Server error'), 'danger');
        }
    } catch (err) {
        console.error('Check-in Error:', err);
        showMessage('Server unreachable.', 'danger');
    }
}

/**
 * POST: Delete a habit
 */
async function deleteHabit(habitId, habitTitle) {
    const confirmed = confirm(`Delete habit "${habitTitle}"?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${habitId}/delete/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (handleAuthFailure(response)) return;

        const result = await response.json();

        if (response.ok) {
            showMessage(`Habit "${habitTitle}" deleted.`, 'success');
            fetchHabits();
        } else {
            showMessage('Could not delete habit: ' + (result.error || 'Server error'), 'danger');
        }
    } catch (err) {
        console.error('Delete Error:', err);
        showMessage('Server unreachable.', 'danger');
    }
}

/**
 * Logout: keep using Django logout route for now
 */
async function handleLogout() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/logout/', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            window.location.href = 'http://127.0.0.1:5500/frontend/login.html';
        } else {
            showMessage('Logout failed.', 'danger');
        }
    } catch (err) {
        console.error('Logout Error:', err);
        showMessage('Server unreachable during logout.', 'danger');
    }
}