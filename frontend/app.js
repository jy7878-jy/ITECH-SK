/**
 * StreakMate AJAX Operations
 * Interacts with Django REST API endpoints
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api/habits';

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    fetchHabits(); 
    document.getElementById('createHabitForm').addEventListener('submit', handleCreateHabit);
});

/**
 * Screen reader announcer for Accessibility (M8 requirement)
 */
function announceMessage(msg) {
    const announcer = document.getElementById('aria-announcer');
    if (announcer) announcer.textContent = msg;
}

/**
 * GET: Retrieve habits list and render to UI
 */
async function fetchHabits() {
    const container = document.getElementById('habitList');
    
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await response.json();

        container.innerHTML = ''; // Clear existing content

        if (data.habits && data.habits.length > 0) {
            data.habits.forEach(habit => {
                const col = document.createElement('div');
                col.className = 'col-md-6';
                col.innerHTML = `
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title fw-bold text-dark">${habit.title}</h5>
                            <p class="card-text text-secondary mb-3">${habit.description || 'No description provided'}</p>
                            <div class="d-flex gap-2 mb-3">
                                <span class="badge bg-primary-subtle text-primary border border-primary-subtle text-capitalize">${habit.frequency}</span>
                                <span class="badge bg-info-subtle text-info border border-info-subtle">Goal: ${habit.goal_per_week}/wk</span>
                            </div>
                            <button onclick="checkInHabit(${habit.id}, '${habit.title}')" class="btn btn-outline-success btn-sm w-100">
                                ✔️ Mark as Done Today
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(col);
            });
            announceMessage("Successfully updated habit list.");
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

    const payload = {
        title: document.getElementById('habitTitle').value.trim(),
        description: document.getElementById('habitDesc').value.trim(),
        frequency_type: document.getElementById('habitFreq').value,
        goal_per_week: parseInt(document.getElementById('habitGoal').value) || 7
    };

    try {
        const response = await fetch(`${API_BASE_URL}/create/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Great! Your new habit has been added.');
            document.getElementById('createHabitForm').reset();
            fetchHabits(); // Reload list without refreshing page
        } else {
            alert('Failed to save habit: ' + (result.error || 'Server error'));
        }
    } catch (err) {
        console.error('Submission Error:', err);
        alert('Critical error connecting to the server.');
    }
}

/**
 * POST: Record daily check-in (Status: Done)
 */
async function checkInHabit(habitId, habitTitle) {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    const payload = {
        date: today,
        status: 'done',
        note: 'Check-in from Web Frontend'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/${habitId}/checkin/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            const msg = result.created ? `Check-in recorded for ${habitTitle}!` : `Check-in status updated for ${habitTitle}.`;
            alert(msg);
            announceMessage(msg);
        } else {
            alert('Could not complete check-in: ' + result.error);
        }
    } catch (err) {
        console.error('Check-in Error:', err);
        alert('Server unreachable.');
    }
}