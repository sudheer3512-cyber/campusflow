// State Management & LocalStorage
let tasks = JSON.parse(localStorage.getItem('acad_tasks')) || [
    { id: '1', title: 'Data Structures Assignment 3', subject: 'Computer Science', priority: 'High', date: '2026-10-16', hours: 3, status: 'todo' },
    { id: '2', title: 'Organic Chemistry Lab Report', subject: 'Chemistry', priority: 'Medium', date: '2026-10-18', hours: 2.5, status: 'in-progress' },
    { id: '3', title: 'Calculus Problem Set #5', subject: 'Mathematics', priority: 'High', date: '2026-10-15', hours: 2, status: 'todo' },
    { id: '4', title: 'Macroeconomics Essay Draft', subject: 'Economics', priority: 'Low', date: '2026-10-20', hours: 4, status: 'completed' }
];

let currentTheme = localStorage.getItem('acad_theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
if (currentTheme === 'dark') {
    document.getElementById('themeToggle').innerHTML = '<i class="fa-solid fa-sun"></i> <span>Light Mode</span>';
}

// Pomodoro Variables
let pomoInterval = null;
let pomoTimeLeft = 25 * 60;
let pomoState = 'work'; // work, shortBreak, longBreak
let isPomoRunning = false;

// DOM Elements & Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

function initApp() {
    updateDateDisplay();
    renderAll();
}

function saveTasks() {
    localStorage.setItem('acad_tasks', JSON.stringify(tasks));
}

function renderAll() {
    renderDashboard();
    renderBalancer();
    renderKanban();
    renderAnalytics();
    updateSubjectFilterOptions();
    updatePomoTaskSelect();
}

// Navigation Tabs
function setupEventListeners() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const tabId = item.getAttribute('data-tab');
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('acad_theme', currentTheme);
        const btn = document.getElementById('themeToggle');
        if (currentTheme === 'dark') {
            btn.innerHTML = '<i class="fa-solid fa-sun"></i> <span>Light Mode</span>';
        } else {
            btn.innerHTML = '<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>';
        }
    });

    // Modal Controls
    const modal = document.getElementById('taskModal');
    document.getElementById('openTaskModal').addEventListener('click', () => {
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = '';
        document.getElementById('modalTitleText').innerText = 'Add New Task';
        // Default due date to today
        document.getElementById('taskDate').valueAsDate = new Date();
        modal.classList.add('active');
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('cancelModalBtn').addEventListener('click', () => modal.classList.remove('active'));

    // Task Form Submit
    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('taskId').value;
        const title = document.getElementById('taskTitle').value;
        const subject = document.getElementById('taskSubject').value;
        const priority = document.getElementById('taskPriority').value;
        const date = document.getElementById('taskDate').value;
        const hours = parseFloat(document.getElementById('taskHours').value);
        const status = document.getElementById('taskStatus').value;

        if (id) {
            // Edit
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.title = title;
                task.subject = subject;
                task.priority = priority;
                task.date = date;
                task.hours = hours;
                task.status = status;
            }
        } else {
            // Create
            const newTask = {
                id: Date.now().toString(),
                title, subject, priority, date, hours, status
            };
            tasks.push(newTask);
        }

        saveTasks();
        renderAll();
        modal.classList.remove('active');
    });

    // Search Bar
    document.getElementById('globalSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        // Switch to Kanban or filter view if typing
        if (query.trim() !== '') {
            document.querySelector('[data-tab="kanban"]').click();
            filterKanban(query);
        } else {
            renderKanban();
        }
    });

    // Kanban Subject Filter
    document.getElementById('kanbanSubjectFilter').addEventListener('change', (e) => {
        renderKanban(e.target.value);
    });

    // Auto-balance Button
    document.getElementById('autoBalanceBtn').addEventListener('click', () => {
        autoBalanceWorkload();
    });

    // Pomodoro Controls
    document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            setPomoMode(e.target.getAttribute('data-mode'));
        });
    });

    document.getElementById('startTimerBtn').addEventListener('click', togglePomodoro);
    document.getElementById('resetTimerBtn').addEventListener('click', resetPomodoro);
}

function updateDateDisplay() {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    document.getElementById('currentDateDisplay').innerText = new Date().toLocaleDateString('en-US', options);
}

// 1. Dashboard Renderer
function renderDashboard() {
    const totalTasks = tasks.length;
    const totalHours = tasks.reduce((acc, t) => acc + (t.status !== 'completed' ? t.hours : 0), 0);
    const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'completed').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    document.getElementById('mTotalTasks').innerText = totalTasks;
    document.getElementById('mTotalHours').innerText = totalHours + 'h';
    document.getElementById('mHighPriority').innerText = highPriority;
    document.getElementById('mCompleted').innerText = completionRate + '%';

    // Today's focus list (Pending tasks due soonest)
    const pendingTasks = tasks.filter(t => t.status !== 'completed').sort((a,b) => new Date(a.date) - new Date(b.date));
    const focusContainer = document.getElementById('todaysFocusList');
    focusContainer.innerHTML = '';

    if (pendingTasks.length === 0) {
        focusContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">All caught up! No pending tasks.</p>';
    } else {
        pendingTasks.slice(0, 3).forEach(t => {
            focusContainer.innerHTML += `
                <div class="focus-item">
                    <div class="focus-item-details">
                        <h4>${t.title}</h4>
                        <span>${t.subject} • Due ${t.date} (${t.hours}h)</span>
                    </div>
                    <button class="btn-secondary" style="padding: 6px 12px; font-size:0.8rem;" onclick="markCompleted('${t.id}')">Done</button>
                </div>
            `;
        });
    }

    // Subject Load Breakdown
    const subjectMap = {};
    tasks.forEach(t => {
        if (t.status !== 'completed') {
            subjectMap[t.subject] = (subjectMap[t.subject] || 0) + t.hours;
        }
    });

    const barsContainer = document.getElementById('subjectLoadBars');
    barsContainer.innerHTML = '';
    const maxSubHours = Math.max(...Object.values(subjectMap), 1);

    for (const [subject, hrs] of Object.entries(subjectMap)) {
        const pct = Math.min(Math.round((hrs / maxSubHours) * 100), 100);
        barsContainer.innerHTML += `
            <div class="subject-bar-row">
                <label><span>${subject}</span> <strong>${hrs}h</strong></label>
                <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${pct}%"></div></div>
            </div>
        `;
    }
    if (Object.keys(subjectMap).length === 0) {
        barsContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No active subject workload.</p>';
    }
}

// 2. Workload Balancer Renderer
function renderBalancer() {
    const grid = document.getElementById('weekDistributionGrid');
    grid.innerHTML = '';

    // Generate next 7 days
    const today = new Date();
    let totalWeeklyHours = 0;

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        const dayTasks = tasks.filter(t => t.date === dateStr && t.status !== 'completed');
        const dayHours = dayTasks.reduce((acc, t) => acc + t.hours, 0);
        totalWeeklyHours += dayHours;

        let tasksHtml = '';
        dayTasks.forEach(t => {
            tasksHtml += `
                <div class="mini-task-pill">
                    <strong>${t.title}</strong>
                    <span>${t.subject} (${t.hours}h)</span>
                </div>
            `;
        });

        if (dayTasks.length === 0) {
            tasksHtml = '<span style="color:var(--text-muted); font-size:0.75rem; text-align:center; margin-top:20px;">Light day</span>';
        }

        grid.innerHTML += `
            <div class="day-column">
                <div class="day-header">
                    <h4>${dayName}</h4>
                    <span>${dayHours}h workload</span>
                </div>
                <div class="day-tasks-list">
                    ${tasksHtml}
                </div>
            </div>
        `;
    }

    // Update status card
    const alertCard = document.getElementById('overloadAlertCard');
    const statusTitle = document.getElementById('balancerStatusTitle');
    const statusDesc = document.getElementById('balancerStatusDesc');
    const workloadStatusText = document.getElementById('workloadStatusText');

    if (totalWeeklyHours > 25) {
        alertCard.classList.add('warning');
        statusTitle.innerText = 'Heavy Overload Alert';
        statusDesc.innerText = `Total upcoming weekly workload is ${totalWeeklyHours}h. Consider using Auto-Balance to redistribute tasks.`;
        workloadStatusText.innerText = 'Heavy';
    } else {
        alertCard.classList.remove('warning');
        statusTitle.innerText = 'Optimal Balance';
        statusDesc.innerText = `Total upcoming weekly workload is ${totalWeeklyHours}h. Your schedule is well-balanced.`;
        workloadStatusText.innerText = 'Balanced';
    }
}

// Auto-balance logic: spreads tasks out across the upcoming 5 days if overload detected
function autoBalanceWorkload() {
    const pending = tasks.filter(t => t.status !== 'completed');
    if (pending.length === 0) {
        alert('No pending tasks to balance!');
        return;
    }

    const today = new Date();
    pending.forEach((t, index) => {
        const targetDate = new Date(today);
        // Spread evenly across 1 to 5 days ahead
        targetDate.setDate(today.getDate() + (index % 5));
        t.date = targetDate.toISOString().split('T')[0];
    });

    saveTasks();
    renderAll();
    alert('✨ Workload successfully re-distributed across the week to prevent burnout!');
}

// 3. Kanban Board Renderer
function renderKanban(subjectFilter = 'all', searchQuery = '') {
    const todoContainer = document.getElementById('tasks-todo');
    const inProgressContainer = document.getElementById('tasks-in-progress');
    const completedContainer = document.getElementById('tasks-completed');

    todoContainer.innerHTML = '';
    inProgressContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    let filtered = tasks;
    if (subjectFilter !== 'all') {
        filtered = filtered.filter(t => t.subject === subjectFilter);
    }
    if (searchQuery) {
        filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery) || t.subject.toLowerCase().includes(searchQuery));
    }

    let counts = { todo: 0, 'in-progress': 0, completed: 0 };

    filtered.forEach(t => {
        counts[t.status]++;
        const cardHtml = `
            <div class="kanban-card" draggable="true" data-id="${t.id}">
                <div class="kanban-card-top">
                    <span class="tag-subject">${t.subject}</span>
                    <span class="tag-priority ${t.priority}">${t.priority}</span>
                </div>
                <h4>${t.title}</h4>
                <div class="kanban-card-footer">
                    <span><i class="fa-regular fa-calendar"></i> ${t.date} (${t.hours}h)</span>
                    <div class="kanban-actions">
                        <button onclick="editTask('${t.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteTask('${t.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;

        if (t.status === 'todo') todoContainer.innerHTML += cardHtml;
        else if (t.status === 'in-progress') inProgressContainer.innerHTML += cardHtml;
        else if (t.status === 'completed') completedContainer.innerHTML += cardHtml;
    });

    document.getElementById('count-todo').innerText = counts.todo;
    document.getElementById('count-inprogress').innerText = counts['in-progress'];
    document.getElementById('count-completed').innerText = counts.completed;
}

function filterKanban(query) {
    renderKanban('all', query);
}

function updateSubjectFilterOptions() {
    const subjects = [...new Set(tasks.map(t => t.subject))];
    const select = document.getElementById('kanbanSubjectFilter');
    select.innerHTML = '<option value="all">All Subjects</option>';
    subjects.forEach(s => {
        select.innerHTML += `<option value="${s}">${s}</option>`;
    });
}

// Task Actions
function markCompleted(id) {
    const t = tasks.find(item => item.id === id);
    if (t) {
        t.status = 'completed';
        saveTasks();
        renderAll();
    }
}

function editTask(id) {
    const t = tasks.find(item => item.id === id);
    if (!t) return;

    document.getElementById('taskId').value = t.id;
    document.getElementById('taskTitle').value = t.title;
    document.getElementById('taskSubject').value = t.subject;
    document.getElementById('taskPriority').value = t.priority;
    document.getElementById('taskDate').value = t.date;
    document.getElementById('taskHours').value = t.hours;
    document.getElementById('taskStatus').value = t.status;
    document.getElementById('modalTitleText').innerText = 'Edit Task';

    document.getElementById('taskModal').classList.add('active');
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderAll();
    }
}

// 4. Pomodoro Timer Logic
function setPomoMode(mode) {
    pomoState = mode;
    clearInterval(pomoInterval);
    isPomoRunning = false;
    document.getElementById('startTimerBtn').innerHTML = '<i class="fa-solid fa-play"></i> Start';

    if (mode === 'work') pomoTimeLeft = 25 * 60;
    else if (mode === 'shortBreak') pomoTimeLeft = 5 * 60;
    else if (mode === 'longBreak') pomoTimeLeft = 15 * 60;

    updateTimerDisplay();
}

function updateTimerDisplay() {
    const mins = Math.floor(pomoTimeLeft / 60);
    const secs = pomoTimeLeft % 60;
    document.getElementById('timerMinutes').innerText = String(mins).padStart(2, '0');
    document.getElementById('timerSeconds').innerText = String(secs).padStart(2, '0');
}

function togglePomodoro() {
    const btn = document.getElementById('startTimerBtn');
    if (isPomoRunning) {
        clearInterval(pomoInterval);
        isPomoRunning = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    } else {
        isPomoRunning = true;
        btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        pomoInterval = setInterval(() => {
            if (pomoTimeLeft > 0) {
                pomoTimeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(pomoInterval);
                isPomoRunning = false;
                alert('⏰ Pomodoro session complete! Great focus.');
                btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
            }
        }, 1000);
    }
}

function resetPomodoro() {
    clearInterval(pomoInterval);
    isPomoRunning = false;
    document.getElementById('startTimerBtn').innerHTML = '<i class="fa-solid fa-play"></i> Start';
    setPomoMode(pomoState);
}

function updatePomoTaskSelect() {
    const select = document.getElementById('pomoTaskSelect');
    select.innerHTML = '<option value="">-- None (General Study) --</option>';
    tasks.filter(t => t.status !== 'completed').forEach(t => {
        select.innerHTML += `<option value="${t.id}">${t.title} (${t.subject})</option>`;
    });
}

// 5. Analytics Renderer
function renderAnalytics() {
    const high = tasks.filter(t => t.priority === 'High').length;
    const med = tasks.filter(t => t.priority === 'Medium').length;
    const low = tasks.filter(t => t.priority === 'Low').length;

    document.getElementById('statHigh').innerText = high;
    document.getElementById('statMed').innerText = med;
    document.getElementById('statLow').innerText = low;
}
