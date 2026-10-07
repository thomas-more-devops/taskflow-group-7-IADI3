/**
 * TaskFlow - Task Management Application
 * ======================================
 * A single-class, dependency-free task manager.
 *
 * Responsibilities of this file:
 *   1. Keep the list of tasks in memory (this.tasks)
 *   2. Persist the tasks in the browser's localStorage
 *   3. Render the list and the statistics into the DOM defined in index.html
 *   4. React to user actions (add, complete, edit, delete)
 *
 * Error handling approach:
 *   - Every localStorage access is wrapped in try/catch, because storage can
 *     be full, disabled (private mode) or contain corrupted data.
 *   - User input is validated before it is stored (empty / too long).
 *   - Errors in UI event handlers are caught and shown as a notification
 *     instead of being thrown, so one failure never breaks the whole app.
 */

// ---------------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------------

/** Keys under which data is stored in localStorage. */
const STORAGE_KEYS = {
    tasks: 'taskflow_tasks',
    counter: 'taskflow_counter'
};

/** Maximum allowed length of one task description (matches CONTRIBUTING.md). */
const MAX_TASK_LENGTH = 500;

/** How long (ms) a notification stays visible before it fades out. */
const NOTIFICATION_DURATION = 3000;

class TaskFlow {
    /**
     * Sets up the application state, then wires up the UI.
     * The order matters: data must be loaded before it can be rendered.
     */
    constructor() {
        // Load saved data first (falls back to an empty list on any error)
        this.tasks = this.loadTasks();
        // Counter that guarantees every task gets a unique id
        this.taskIdCounter = this.getNextTaskId();

        this.initializeApp();
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    /** Logs a start-up message and shows the welcome hint. */
    initializeApp() {
        console.log('TaskFlow initialized successfully!');
        this.showWelcomeMessage();
    }

    /** Shows a hint in the console when the user has no tasks yet. */
    showWelcomeMessage() {
        if (this.tasks.length === 0) {
            console.log('Welcome to TaskFlow! Add your first task to get started.');
        }
    }

    // -----------------------------------------------------------------------
    // Event handling
    // -----------------------------------------------------------------------

    /**
     * Attaches the click / keyboard listeners for adding tasks.
     * Edit, complete and delete buttons are created dynamically in
     * renderTasks() and use inline onclick handlers instead.
     * @throws {Error} If the required HTML elements are missing from the page.
     */
    bindEvents() {
        const addTaskBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');

        // Fail early with a clear message if index.html was changed
        if (!addTaskBtn || !taskInput) {
            throw new Error('Required elements #addTaskBtn / #taskInput not found in the page');
        }

        addTaskBtn.addEventListener('click', () => this.addTask());

        // Allow adding a task by pressing Enter inside the input field
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Focus on input when page loads
        taskInput.focus();
    }

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    /**
     * Checks a task description before it is stored.
     * @param {*} text - The raw value entered by the user.
     * @returns {{valid: boolean, message: string}} Result with a user-friendly message.
     */
    validateTaskText(text) {
        if (typeof text !== 'string' || text.trim() === '') {
            return { valid: false, message: 'Please enter a task description' };
        }
        if (text.trim().length > MAX_TASK_LENGTH) {
            return {
                valid: false,
                message: `Task is too long (maximum ${MAX_TASK_LENGTH} characters)`
            };
        }
        return { valid: true, message: '' };
    }

    // -----------------------------------------------------------------------
    // Task actions (create / update / delete)
    // -----------------------------------------------------------------------

    /**
     * Reads the input field, validates it and adds a new task.
     * Invalid input shows a warning and leaves the list untouched.
     */
    addTask() {
        try {
            const taskInput = document.getElementById('taskInput');
            const taskText = taskInput.value.trim();

            const check = this.validateTaskText(taskText);
            if (!check.valid) {
                this.showNotification(check.message, 'warning');
                taskInput.focus();
                return;
            }

            const newTask = {
                id: this.taskIdCounter++,           // unique, ever-increasing id
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString(), // ISO string is JSON-safe
                completedAt: null                    // filled in when completed
            };

            this.tasks.push(newTask);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();

            taskInput.value = '';
            taskInput.focus();

            this.showNotification('Task added successfully!', 'success');
        } catch (error) {
            console.error('Failed to add task:', error);
            this.showNotification('Something went wrong while adding the task.', 'error');
        }
    }

    /**
     * Deletes a task after the user confirms.
     * @param {number} taskId - Id of the task to remove.
     */
    deleteTask(taskId) {
        try {
            if (confirm('Are you sure you want to delete this task?')) {
                this.tasks = this.tasks.filter(task => task.id !== taskId);
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                this.showNotification('Task deleted successfully!', 'success');
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
            this.showNotification('Something went wrong while deleting the task.', 'error');
        }
    }

    /**
     * Switches a task between "completed" and "pending".
     * Also records (or clears) the completion timestamp used by getTaskStats().
     * @param {number} taskId - Id of the task to toggle.
     */
    toggleTask(taskId) {
        try {
            const task = this.tasks.find(task => task.id === taskId);
            if (!task) {
                console.warn(`toggleTask: no task found with id ${taskId}`);
                return;
            }

            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();

            const message = task.completed ? 'Task completed! 🎉' : 'Task marked as pending';
            this.showNotification(message, 'success');
        } catch (error) {
            console.error('Failed to update task:', error);
            this.showNotification('Something went wrong while updating the task.', 'error');
        }
    }

    /**
     * Lets the user change the text of a task via a prompt dialog.
     * Cancelling the dialog or entering invalid text keeps the old text.
     * @param {number} taskId - Id of the task to edit.
     */
    editTask(taskId) {
        try {
            const task = this.tasks.find(task => task.id === taskId);
            if (!task) {
                console.warn(`editTask: no task found with id ${taskId}`);
                return;
            }

            const newText = prompt('Edit task:', task.text);
            if (newText === null) {
                return; // user pressed Cancel
            }

            const check = this.validateTaskText(newText);
            if (!check.valid) {
                this.showNotification(check.message, 'warning');
                return;
            }

            task.text = newText.trim();
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task updated successfully!', 'success');
        } catch (error) {
            console.error('Failed to edit task:', error);
            this.showNotification('Something went wrong while editing the task.', 'error');
        }
    }

    // -----------------------------------------------------------------------
    // Rendering
    // -----------------------------------------------------------------------

    /**
     * Rebuilds the task list in the DOM from this.tasks.
     * Shows the "empty state" block when there are no tasks.
     */
    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');

        if (!tasksList || !emptyState) {
            console.error('renderTasks: #tasksList or #emptyState missing from the page');
            return;
        }

        if (this.tasks.length === 0) {
            tasksList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        tasksList.style.display = 'flex';
        emptyState.style.display = 'none';

        // Sort tasks: incomplete first, then newest first.
        // A copy ([...]) is sorted so the stored order is never changed.
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed - b.completed; // false (0) sorts before true (1)
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Task text is passed through escapeHtml() to prevent XSS.
        tasksList.innerHTML = sortedTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-content">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="taskFlow.toggleTask(${task.id})">
                    </div>
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" onclick="taskFlow.editTask(${task.id})" title="Edit task">
                        ✏️
                    </button>
                    <button class="task-btn delete-btn" onclick="taskFlow.deleteTask(${task.id})" title="Delete task">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    /** Updates the three statistic cards and the task counter in the header. */
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        const totalEl = document.getElementById('totalTasks');
        const completedEl = document.getElementById('completedTasks');
        const pendingEl = document.getElementById('pendingTasks');
        const taskCount = document.getElementById('taskCount');

        if (!totalEl || !completedEl || !pendingEl || !taskCount) {
            console.error('updateStats: one or more statistic elements are missing');
            return;
        }

        totalEl.textContent = totalTasks;
        completedEl.textContent = completedTasks;
        pendingEl.textContent = pendingTasks;

        // Update task count in header (handles singular / plural)
        taskCount.textContent = `${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'}`;
    }

    // -----------------------------------------------------------------------
    // Persistence (localStorage)
    // -----------------------------------------------------------------------

    /**
     * Writes tasks and the id counter to localStorage.
     * Shows an error notification if storage is full or unavailable.
     */
    saveTasks() {
        try {
            localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(this.tasks));
            localStorage.setItem(STORAGE_KEYS.counter, this.taskIdCounter.toString());
        } catch (error) {
            console.error('Failed to save tasks:', error);
            // QuotaExceededError means the browser storage is full
            const message = error && error.name === 'QuotaExceededError'
                ? 'Browser storage is full. Delete some tasks and try again.'
                : 'Failed to save tasks. Please check your browser storage.';
            this.showNotification(message, 'error');
        }
    }

    /**
     * Reads the saved tasks from localStorage.
     * Never throws: corrupted or invalid data results in an empty list
     * (or in the valid tasks only) so the app can always start.
     * @returns {Array<Object>} The list of saved tasks.
     */
    loadTasks() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.tasks);
            if (!saved) {
                return [];
            }

            const parsed = JSON.parse(saved);

            // JSON.parse can succeed but return something that is not a list
            if (!Array.isArray(parsed)) {
                console.warn('Saved tasks have an unexpected format. Starting with an empty list.');
                return [];
            }

            // Drop entries that are missing required fields
            const validTasks = parsed.filter(task =>
                task &&
                typeof task.id === 'number' &&
                typeof task.text === 'string' &&
                typeof task.completed === 'boolean'
            );
            if (validTasks.length !== parsed.length) {
                console.warn(`Skipped ${parsed.length - validTasks.length} invalid saved task(s).`);
            }
            return validTasks;
        } catch (error) {
            console.error('Failed to load tasks:', error);
            return [];
        }
    }

    /**
     * Determines the next free task id.
     * Uses the saved counter, but never returns an id that already exists.
     * @returns {number} A unique id for the next task.
     */
    getNextTaskId() {
        let counter = 1;
        try {
            const saved = parseInt(localStorage.getItem(STORAGE_KEYS.counter), 10);
            if (!Number.isNaN(saved) && saved > 0) {
                counter = saved;
            }
        } catch (error) {
            console.error('Failed to load task counter:', error);
        }

        // Safety net: if the counter was lost or corrupted, avoid duplicate ids
        const highestId = this.tasks.reduce((max, task) => Math.max(max, task.id), 0);
        return Math.max(counter, highestId + 1);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Escapes HTML special characters so user text cannot inject markup (XSS).
     * @param {*} unsafe - Text to escape (non-strings are converted first).
     * @returns {string} Safe text for use inside innerHTML.
     */
    escapeHtml(unsafe) {
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Shows a temporary toast message in the top-right corner.
     * @param {string} message - Text to display.
     * @param {'success'|'error'|'warning'|'info'} [type='info'] - Controls the colour.
     */
    showNotification(message, type = 'info') {
        // Always log, so messages are still visible if the DOM is unavailable
        console.log(`[${type.toUpperCase()}] ${message}`);

        if (!document.body) {
            return;
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            max-width: 300px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        `;

        // Set color based on type (same palette as the CSS / README)
        const colors = {
            success: '#48bb78',
            error: '#e53e3e',
            warning: '#ed8936',
            info: '#3182ce'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message; // textContent: safe against XSS

        document.body.appendChild(notification);

        // Animate in (short delay so the CSS transition can start)
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);

        // Fade out, then remove from the DOM
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            // remove() does nothing if the element is already gone
            setTimeout(() => notification.remove(), 300);
        }, NOTIFICATION_DURATION);
    }

    // -----------------------------------------------------------------------
    // Utility methods for potential future features
    // (not connected to the UI yet - see "Future Enhancements" in README)
    // -----------------------------------------------------------------------

    /** Downloads all tasks as a JSON backup file. */
    exportTasks() {
        try {
            const dataStr = JSON.stringify(this.tasks, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'taskflow_backup.json';
            link.click();

            // Free the memory used by the temporary URL
            URL.revokeObjectURL(url);
            this.showNotification('Tasks exported successfully!', 'success');
        } catch (error) {
            console.error('Failed to export tasks:', error);
            this.showNotification('Export failed. Please try again.', 'error');
        }
    }

    /** Deletes ALL tasks after confirmation. */
    clearAllTasks() {
        try {
            if (confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
                this.tasks = [];
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                this.showNotification('All tasks cleared!', 'success');
            }
        } catch (error) {
            console.error('Failed to clear tasks:', error);
            this.showNotification('Something went wrong while clearing tasks.', 'error');
        }
    }

    /**
     * Calculates extended statistics (including "today" figures).
     * @returns {{total: number, completed: number, pending: number,
     *            createdToday: number, completedToday: number}}
     */
    getTaskStats() {
        const now = new Date();
        const stats = {
            total: this.tasks.length,
            completed: this.tasks.filter(t => t.completed).length,
            pending: this.tasks.filter(t => !t.completed).length,
            createdToday: this.tasks.filter(t => {
                const taskDate = new Date(t.createdAt);
                return taskDate.toDateString() === now.toDateString();
            }).length,
            completedToday: this.tasks.filter(t => {
                if (!t.completedAt) return false;
                const completedDate = new Date(t.completedAt);
                return completedDate.toDateString() === now.toDateString();
            }).length
        };
        return stats;
    }
}

// Initialize the app when DOM is loaded.
// window.taskFlow must be global because the inline onclick handlers use it.
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.taskFlow = new TaskFlow();
    } catch (error) {
        console.error('TaskFlow failed to start:', error);
        alert('TaskFlow could not start. Please reload the page.');
    }
});

// Export for potential testing (only active in Node.js, ignored in the browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskFlow;
}