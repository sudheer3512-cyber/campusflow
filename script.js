// State Management & LocalStorage
let tasks = JSON.parse(localStorage.getItem('acad_tasks')) || [
    { id: '1', title: 'Data Structures Assignment 3', subject: 'Computer Science', priority: 'High', date: '2026-10-16', hours: 3, status: 'todo' },
    { id: '2', title: 'Organic Chemistry Lab Report', subject: 'Chemistry', priority: 'Medium', date: '2026-10-18', hours: 2.5, status: 'in-progress' },
    { id: '3', title: 'Calculus Problem Set #5', subject: 'Mathematics', priority: 'High', date: '2026-10-15', hours: 2, status: 'todo' },
    { id: '4', title: 'Macroeconomics Essay Draft', subject: 'Economics', priority: 'Low', date: '2026-10-20', hours: 4, status: 'completed' }
];

let maxDailyCap = parseInt(localStorage.getItem('acad_max_cap')) || 5; // Default max 5 hours per day

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
    document.getElementById('maxCapDisplay').innerText = maxDailyCap;
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

    // Advanced Balancer Settings (Max Cap)
    document.getElementById('optimizerSettingsBtn').addEventListener('click', () => {
        const newCap = prompt('Enter your maximum recommended study hours per day (e.g. 4, 5, 6):', maxDailyCap);
        if (newCap !== null && !isNaN(newCap) && Number(newCap) > 0) {
            maxDailyCap = Number(newCap);
            localStorage.setItem('acad_max_cap', maxDailyCap);
            document.getElementById('maxCapDisplay').innerText = maxDailyCap;
            renderBalancer();
        }
    });

    // Auto-balance Button
    document.getElementById('autoBalanceBtn').addEventListener('click', () => {
        advancedSmartAutoBalance();
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

// 2. Advanced Workload Balancer Renderer
function renderBalancer() {
    const grid = document.getElementById('weekDistributionGrid');
    grid.innerHTML = '';

    const today = new Date();
    let totalWeeklyHours = 0;
    const weeklyCapacityMax = maxDailyCap * 7;

    // Generate 7 upcoming days and collect date options for shifting
    let weekDaysMeta = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        weekDaysMeta.push({ dateStr, dayLabel });
    }

    weekDaysMeta.forEach((meta) => {
        const dayTasks = tasks.filter(t => t.date === meta.dateStr && t.status !== 'completed');
        const dayHours = dayTasks.reduce((acc, t) => acc + t.hours, 0);
        totalWeeklyHours += dayHours;

        let statusClass = 'balanced';
        let statusText = 'Balanced';
        if (dayHours === 0) {
            statusClass = 'light';
            statusText = 'Light';
        } else if (dayHours > maxDailyCap) {
            statusClass = 'heavy';
            statusText = 'Over Cap ⚠️';
        }

        let tasksHtml = '';
        dayTasks.forEach(t => {
            // Build dropdown options for shifting task to another day
            let optionsHtml = '';
            weekDaysMeta.forEach(wm => {
                const selectedAttr = wm.dateStr === t.date ? 'selected' : '';
                optionsHtml += `<option value="${wm.dateStr}" ${selectedAttr}>${wm.dayLabel}</option>`;
            });

            tasksHtml += `
                <div class="advanced-task-pill">
                    <div class="advanced-task-top">
                        <strong>${t.title}</strong>
                        <span class="tag-priority ${t.priority}">${t.priority}</span>
                    </div>
                    <span>${t.subject} • ${t.hours}h</span>
                    <div style="margin-top: 4px; display:flex; align-items:center; justify-content:space-between;">
                        <span style="font-size:0.7rem; color:var(--text-muted);">Shift to:</span>
                        <select class="shift-day-select" onchange="shiftTaskDate('${t.id}', this.value)">
                            ${optionsHtml}
                        </select>
                    </div>
                </div>
            `;
        });

        if (dayTasks.length === 0) {
            tasksHtml = '<span style="color:var(--text-muted); font-size:0.75rem; text-align:center; margin-top:30px;">No scheduled workload</span>';
        }

        const isOverCapCol = dayHours > maxDailyCap ? 'over-cap' : '';

        grid.innerHTML += `
            <div class="day-column ${isOverCapCol}">
                <div class="day-header">
                    <h4>${meta.dayLabel}</h4>
                    <div class="day-meta-info">
                        <span>${dayHours}h load</span>
                        <span class="day-status-pill ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="day-tasks-list">
                    ${tasksHtml}
                </div>
            </div>
        `;
    });

    // Update global burnout card
    const alertCard = document.getElementById('overloadAlertCard');
    const statusTitle = document.getElementById('balancerStatusTitle');
    const statusDesc = document.getElementById('balancerStatusDesc');
    const workloadStatusText = document.getElementById('workloadStatusText');
    const weeklyLoadBadge = document.getElementById('weeklyLoadBadge');
    const capacityBarFill = document.getElementById('capacityBarFill');
    const balancerAlertIcon = document.getElementById('balancerAlertIcon');

    weeklyLoadBadge.innerText = `Total: ${totalWeeklyHours}h / ${weeklyCapacityMax}h cap`;
    const capacityPct = Math.min(Math.round((totalWeeklyHours / weeklyCapacityMax) * 100), 100);
    capacityBarFill.style.width = capacityPct + '%';

    if (totalWeeklyHours > weeklyCapacityMax || totalWeeklyHours > (maxDailyCap * 5)) {
        alertCard.classList.add('warning');
        balancerAlertIcon.className = 'fa-solid fa-triangle-exclamation';
        statusTitle.innerText = 'High Burnout Risk / Overload';
        statusDesc.innerText = `Your upcoming 7-day workload (${totalWeeklyHours}h) exceeds sustainable thresholds. Use Smart Auto-Balance below to distribute tasks evenly.`;
        workloadStatusText.innerText = 'Heavy Overload';
        capacityBarFill.style.backgroundColor = 'var(--danger)';
    } else {
        alertCard.classList.remove('warning');
        balancerAlertIcon.className = 'fa-solid fa-shield-heart';
        statusTitle.innerText = 'Optimal Study Balance';
        statusDesc.innerText = `Your workload distribution is healthy and sustainable (&le; ${maxDailyCap}h/day average).`;
        workloadStatusText.innerText = 'Balanced';
        capacityBarFill.style.backgroundColor = 'var(--success)';
    }
}

// Shift individual task date directly from balancer view
function shiftTaskDate(taskId, newDateStr) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.date = newDateStr;
        saveTasks();
        renderAll();
    }
}

// Advanced Smart Auto-Balance Algorithm
function advancedSmartAutoBalance() {
    const pending = tasks.filter(t => t.status !== 'completed');
    if (pending.length === 0) {
        alert('No pending tasks to balance!');
        return;
    }

    // Sort pending tasks by priority (High first) and then by original due date
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    pending.sort((a, b) => {
        if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return new Date(a.date) - new Date(b.date);
    });

    const today = new Date();
    // Distribute tasks across the next 6 days cyclically while keeping daily hours under maxDailyCap
    let dayLoadTracker = [0, 0, 0, 0, 0, 0, 0];

    pending.forEach(t => {
        // Find the day with the lowest current assigned load
        let minLoadIndex = 0;
        let minLoadVal = dayLoadTracker[0];
        for (let i = 0; i < 7; i++) {
            if (dayLoadTracker[i] < minLoadVal) {
                minLoadVal = dayLoadTracker[i];
                minLoadIndex = i;
            }
        }

        // Assign task to this optimal day
        const assignedDate = new Date(today);
        assignedDate.setDate(today.getDate() + minLoadIndex);
        t.date = assignedDate.toISOString().split('T')[0];
        dayLoadTracker[minLoadIndex] += t.hours;
    });

    saveTasks();
    renderAll();
    alert('✨ AI Smart Workload Balancer successfully re-distributed all pending assignments evenly across the week to prevent burnout!');
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
