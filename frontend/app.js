/**
 * StreakMate AJAX Operations
 * Interacts with Django REST API endpoints
 */

const API_BASE_URL = window.AppConfig.habitsApiBaseUrl;

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.AppUtils.ensureCsrfCookie();
    } catch (error) {
        console.warn("Could not fetch CSRF token. Backend might be asleep or unreachable.", error);
    }
    
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
    const refreshBtn = document.getElementById('refreshHabitsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchHabits);
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
 * Handle unauthenticated API responses
 */
function handleAuthFailure(response) {
    if (response.status === 401) {
        window.location.assign('login.html');
        return true;
    }
    return false;
}

async function loadCurrentUser() {
    const welcomeText = document.getElementById('welcomeText');
    if (!welcomeText) return;

    try {
        const response = await fetch(`${window.AppConfig.apiBaseUrl}/me/`, {
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
 * Render one habit card safely using DOM methods (XSS prevention)
 */
function createHabitCard(habit) {
    const col = document.createElement('div');
    col.className = 'col-md-6';

    const card = document.createElement('div');
    card.className = 'card h-100 border-0 shadow-sm';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h5');
    title.className = 'card-title fw-bold text-dark';
    title.textContent = habit.title;

    const desc = document.createElement('p');
    desc.className = 'card-text text-secondary mb-3';
    desc.textContent = habit.description || 'No description provided';

    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'd-flex flex-wrap gap-2 mb-3';

    const freqBadge = document.createElement('span');
    freqBadge.className = 'badge bg-primary-subtle text-primary border border-primary-subtle text-capitalize';
    freqBadge.textContent = habit.frequency;
    badgeContainer.appendChild(freqBadge);

    if (habit.frequency === 'daily') {
        const dailyBadge = document.createElement('span');
        if (habit.done_today) {
            dailyBadge.className = 'badge bg-success-subtle text-success border border-success-subtle';
            dailyBadge.textContent = 'Completed Today';
        } else {
            dailyBadge.className = 'badge bg-light text-dark border';
            dailyBadge.textContent = 'Not completed today';
        }
        badgeContainer.appendChild(dailyBadge);
    } else {
        const targetBadge = document.createElement('span');
        targetBadge.className = 'badge bg-info-subtle text-info border border-info-subtle';
        targetBadge.textContent = `Target: ${habit.goal_per_week}/week`;
        badgeContainer.appendChild(targetBadge);

        const progressBadge = document.createElement('span');
        progressBadge.className = 'badge bg-warning-subtle text-warning border border-warning-subtle';
        progressBadge.textContent = `This week: ${habit.weekly_progress || 0}/${habit.goal_per_week}`;
        badgeContainer.appendChild(progressBadge);

        if ((habit.weekly_progress || 0) >= habit.goal_per_week) {
            const successBadge = document.createElement('span');
            successBadge.className = 'badge bg-success-subtle text-success border border-success-subtle';
            successBadge.textContent = 'Goal reached';
            badgeContainer.appendChild(successBadge);
        }
    }

    const actionContainer = document.createElement('div');
    actionContainer.className = 'd-grid gap-2';

    if (habit.frequency === 'daily') {
        const actionBtn = document.createElement('button');
        if (habit.done_today) {
            actionBtn.className = 'btn btn-success btn-sm';
            actionBtn.disabled = true;
            actionBtn.textContent = '✔ Completed Today';
        } else {
            actionBtn.className = 'btn btn-outline-success btn-sm';
            actionBtn.textContent = '✔ Mark as Done Today';
            actionBtn.addEventListener('click', () => checkInHabit(habit.id, habit.title));
        }
        actionContainer.appendChild(actionBtn);
    } else {
        const actionBtn = document.createElement('button');
        actionBtn.className = 'btn btn-outline-success btn-sm';
        actionBtn.textContent = '＋ Add 1 Weekly Progress';
        actionBtn.addEventListener('click', () => checkInHabit(habit.id, habit.title));
        actionContainer.appendChild(actionBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline-danger btn-sm';
    deleteBtn.textContent = 'Delete Habit';
    deleteBtn.addEventListener('click', () => deleteHabit(habit.id, habit.title));
    actionContainer.appendChild(deleteBtn);

    cardBody.appendChild(title);
    cardBody.appendChild(desc);
    cardBody.appendChild(badgeContainer);
    cardBody.appendChild(actionContainer);
    card.appendChild(cardBody);
    col.appendChild(card);

    return col;
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
        
        // Handle unauthorized (redirects to login)
        if (handleAuthFailure(response)) return;

        // Reveal the main UI and hide the initial loading screen since we are authenticated
        const pageLoader = document.getElementById('pageLoading');
        const mainContent = document.getElementById('mainContent');
        if (pageLoader) pageLoader.classList.add('d-none');
        if (mainContent) mainContent.classList.remove('d-none');

        const data = await response.json();
        container.innerHTML = '';

        if (data.habits && data.habits.length > 0) {
            data.habits.forEach(habit => {
                container.appendChild(createHabitCard(habit));
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
        // Reveal UI even if there's a connection error so user doesn't see endless spinning
        const pageLoader = document.getElementById('pageLoading');
        const mainContent = document.getElementById('mainContent');
        if (pageLoader) pageLoader.classList.add('d-none');
        if (mainContent) mainContent.classList.remove('d-none');
        
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
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': window.AppUtils.getCsrfToken() },
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
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': window.AppUtils.getCsrfToken() },
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
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': window.AppUtils.getCsrfToken() },
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
        const csrfToken = window.AppUtils.getCsrfToken();
        const response = await fetch(`${window.AppConfig.apiBaseUrl}/logout/`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'X-CSRFToken': csrfToken }
        });

        if (response.ok) {
            window.location.href = 'login.html';
        } else {
            showMessage('Logout failed.', 'danger');
        }
    } catch (err) {
        console.error('Logout Error:', err);
        showMessage('Server unreachable during logout.', 'danger');
    }
}