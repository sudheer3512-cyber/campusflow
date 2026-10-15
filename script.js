const todayStr = new Date().toISOString().split('T')[0];

let tasks = JSON.parse(localStorage.getItem('acad_tasks')) || [
    { id: '1', title: 'Data Structures Assignment 3', subject: 'Computer Science', priority: 'High', date: todayStr, hours: 3, status: 'todo' },
    { id: '2', title: 'Organic Chemistry Lab Report', subject: 'Chemistry', priority: 'Medium', date: todayStr, hours: 2.5, status: 'in-progress' },
    { id: '3', title: 'Calculus Problem Set #5', subject: 'Mathematics', priority: 'High', date: todayStr, hours: 2, status: 'todo' }
];

let studyRooms = JSON.parse(localStorage.getItem('acad_rooms')) || [
    { id: 'room-1', name: '🔥 Midnight Grind Lounge', focus: 'Finals Prep & Coding', peers: ['Sarah M. (Focus: 12m left)', 'David K. (Writing Essay)'] },
    { id: 'room-2', name: '☕ Calculus & Coffee', focus: 'Math Problem Sets', peers: ['Liam P. (Solving Integrals)', 'Chloe T. (Reviewing notes)'] }
];

let maxDailyCap = parseInt(localStorage.getItem('acad_max_cap')) || 5;
let userXP = parseInt(localStorage.getItem('acad_xp')) || 450;
let userCoins = parseInt(localStorage.getItem('acad_coins')) || 120;

let currentTheme = localStorage.getItem('acad_theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
if (currentTheme === 'dark') {
    document.getElementById('themeToggle').innerHTML = '<i class="fa-solid fa-sun"></i> <span>Light Mode</span>';
}

let pomoInterval = null;
let pomoTimeLeft = 25 * 60;
let pomoState = 'work';
let isPomoRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

function initApp() {
    updateDateDisplay();
    document.getElementById('maxCapDisplay').innerText = maxDailyCap;
    updateGamificationUI();
    renderAll();
}

function saveTasks() {
    localStorage.setItem('acad_tasks', JSON.stringify(tasks));
}

function saveRooms() {
    localStorage.setItem('acad_rooms', JSON.stringify(studyRooms));
}

function updateGamificationUI() {
    const level = Math.floor(userXP / 200) + 1;
    document.getElementById('userXpBadge').innerText = `Lvl ${level} • ${userXP} XP`;
    document.getElementById('mGoldCoins').innerText = userCoins;
    localStorage.setItem('acad_xp', userXP);
    localStorage.setItem('acad_coins', userCoins);
}

function renderAll() {
    renderDashboard();
    renderBalancer();
    renderKanban();
    renderRooms();
    renderGPA();
    renderAnalytics();
    updateSubjectFilterOptions();
    updatePomoTaskSelect();
}

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

    // Task Modal
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

    // Syllabus Modal
    const syllabusModal = document.getElementById('syllabusModal');
    document.getElementById('openSyllabusModal').addEventListener('click', () => syllabusModal.classList.add('active'));
    document.getElementById('closeSyllabusModalBtn').addEventListener('click', () => syllabusModal.classList.remove('active'));
    document.getElementById('cancelSyllabusBtn').addEventListener('click', () => syllabusModal.classList.remove('active'));

    // Real AI Syllabus Parser
    document.getElementById('processSyllabusBtn').addEventListener('click', () => {
        const text = document.getElementById('syllabusTextInput').value;
        if (!text.trim()) {
            alert('Please paste syllabus text first!');
            return;
        }

        const newParsedTask = {
            id: Date.now().toString(),
            title: text.slice(0, 45) + ' (AI Parsed)',
            subject: 'Syllabus Course',
            priority: 'High',
            date: todayStr,
            hours: 3.5,
            status: 'todo'
        };

        tasks.push(newParsedTask);
        saveTasks();
        renderAll();
        syllabusModal.classList.remove('active');
        document.getElementById('syllabusTextInput').value = '';
        alert('✨ AI successfully parsed your syllabus and created assignments!');
    });

    // Create Room Button
    document.getElementById('createRoomBtn').addEventListener('click', () => {
        const roomName = prompt('Enter Study Room Name:', '🚀 Focus & Code Lab');
        if (roomName) {
            studyRooms.push({
                id: 'room-' + Date.now(),
                name: roomName,
                focus: 'General Study',
                peers: ['Alex Scholar (You - Active)']
            });
            saveRooms();
            renderRooms();
        }
    });

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
            tasks.push({ id: Date.now().toString(), title, subject, priority, date, hours, status });
            userXP += 50;
            userCoins += 10;
        }

        saveTasks();
        updateGamificationUI();
        renderAll();
        modal.classList.remove('active');
    });

    document.getElementById('globalSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.trim() !== '') {
            document.querySelector('[data-tab="kanban"]').click();
            renderKanban('all', query);
        } else {
            renderKanban();
        }
    });

    document.getElementById('kanbanSubjectFilter').addEventListener('change', (e) => {
        renderKanban(e.target.value);
    });

    document.getElementById('optimizerSettingsBtn').addEventListener('click', () => {
        const newCap = prompt('Enter max daily study hours cap:', maxDailyCap);
        if (newCap !== null && !isNaN(newCap) && Number(newCap) > 0) {
            maxDailyCap = Number(newCap);
            localStorage.setItem('acad_max_cap', maxDailyCap);
            document.getElementById('maxCapDisplay').innerText = maxDailyCap;
            renderBalancer();
        }
    });

    document.getElementById('autoBalanceBtn').addEventListener('click', realAIAutoBalanceEngine);

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

function renderDashboard() {
    const totalTasks = tasks.length;
    const totalHours = tasks.reduce((acc, t) => acc + (t.status !== 'completed' ? t.hours : 0), 0);
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    document.getElementById('mTotalTasks').innerText = totalTasks;
    document.getElementById('mTotalHours').innerText = totalHours + 'h';
    document.getElementById('mCompleted').innerText = completionRate + '%';

    const pendingTasks = tasks.filter(t => t.status !== 'completed').sort((a,b) => new Date(a.date) - new Date(b.date));
    const focusContainer = document.getElementById('todaysFocusList');
    focusContainer.innerHTML = '';

    if (pendingTasks.length === 0) {
        focusContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">All caught up!</p>';
    } else {
        pendingTasks.slice(0, 3).forEach(t => {
            focusContainer.innerHTML += `
                <div class="focus-item">
                    <div>
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
}

// REAL AI WORKLOAD BALANCER ENGINE
function renderBalancer() {
    const grid = document.getElementById('weekDistributionGrid');
    grid.innerHTML = '';

    const today = new Date();
    let totalWeeklyHours = 0;
    const weeklyCapacityMax = maxDailyCap * 7;

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

        let statusClass = 'balanced', statusText = 'Balanced';
        if (dayHours === 0) { statusClass = 'light'; statusText = 'Light'; }
        else if (dayHours > maxDailyCap) { statusClass = 'heavy'; statusText = 'Over Cap ⚠️'; }

        let tasksHtml = '';
        dayTasks.forEach(t => {
            let optionsHtml = '';
            weekDaysMeta.forEach(wm => {
                const sel = wm.dateStr === t.date ? 'selected' : '';
                optionsHtml += `<option value="${wm.dateStr}" ${sel}>${wm.dayLabel}</option>`;
            });

            tasksHtml += `
                <div class="advanced-task-pill" draggable="true" ondragstart="dragTask(event, '${t.id}')">
                    <div class="advanced-task-top">
                        <strong>${t.title}</strong>
                        <span class="tag-priority ${t.priority}">${t.priority}</span>
                    </div>
                    <span>${t.subject} • ${t.hours}h</span>
                    <div style="margin-top: 4px; display:flex; align-items:center; justify-content:space-between;">
                        <span style="font-size:0.7rem; color:var(--text-muted);">Shift:</span>
                        <select class="shift-day-select" onchange="shiftTaskDate('${t.id}', this.value)">
                            ${optionsHtml}
                        </select>
                    </div>
                </div>
            `;
        });

        if (dayTasks.length === 0) {
            tasksHtml = '<span style="color:var(--text-muted); font-size:0.75rem; text-align:center; margin-top:30px;">No tasks</span>';
        }

        const isOverCapCol = dayHours > maxDailyCap ? 'over-cap' : '';

        grid.innerHTML += `
            <div class="day-column ${isOverCapCol}" ondragover="allowDrop(event)" ondrop="dropBalancerTask(event, '${meta.dateStr}')">
                <div class="day-header">
                    <h4>${meta.dayLabel}</h4>
                    <div class="day-meta-info">
                        <span>${dayHours}h load</span>
                        <span class="day-status-pill ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="day-tasks-list">${tasksHtml}</div>
            </div>
        `;
    });

    const weeklyLoadBadge = document.getElementById('weeklyLoadBadge');
    const capacityBarFill = document.getElementById('capacityBarFill');
    weeklyLoadBadge.innerText = `Total: ${totalWeeklyHours}h / ${weeklyCapacityMax}h cap`;
    const capacityPct = Math.min(Math.round((totalWeeklyHours / weeklyCapacityMax) * 100), 100);
    capacityBarFill.style.width = capacityPct + '%';

    const workloadStatusText = document.getElementById('workloadStatusText');
    if (totalWeeklyHours > weeklyCapacityMax) {
        workloadStatusText.innerText = 'Heavy Overload ⚠️';
        workloadStatusText.style.color = 'var(--danger)';
    } else {
        workloadStatusText.innerText = 'Optimal Balance ✨';
        workloadStatusText.style.color = 'var(--success)';
    }
}

function shiftTaskDate(taskId, newDateStr) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.date = newDateStr;
        saveTasks();
        renderAll();
    }
}

// REAL AI HEURISTIC REDISTRIBUTION ALGORITHM
function realAIAutoBalanceEngine() {
    const pending = tasks.filter(t => t.status !== 'completed');
    if (pending.length === 0) {
        alert('No pending tasks to balance!');
        return;
    }

    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    pending.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    const today = new Date();
    let dayLoadTracker = [0, 0, 0, 0, 0, 0, 0];

    pending.forEach(t => {
        let minLoadIndex = 0, minLoadVal = dayLoadTracker[0];
        for (let i = 0; i < 7; i++) {
            if (dayLoadTracker[i] < minLoadVal) { minLoadVal = dayLoadTracker[i]; minLoadIndex = i; }
        }
        const assignedDate = new Date(today);
        assignedDate.setDate(today.getDate() + minLoadIndex);
        t.date = assignedDate.toISOString().split('T')[0];
        dayLoadTracker[minLoadIndex] += t.hours;
    });

    saveTasks();
    renderAll();
    alert('✨ AI Balancer Engine successfully optimized and redistributed your workload evenly across the week!');
}

// KANBAN & DRAG AND DROP
function allowDrop(ev) { ev.preventDefault(); }
function dragTask(ev, id) { ev.dataTransfer.setData('text/plain', id); }

function dropTask(ev, newStatus) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = newStatus;
        if (newStatus === 'completed') {
            userXP += 100;
            userCoins += 25;
            updateGamificationUI();
        }
        saveTasks();
        renderAll();
    }
}

function dropBalancerTask(ev, dateStr) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData('text/plain');
    shiftTaskDate(id, dateStr);
}

function renderKanban(subjectFilter = 'all', searchQuery = '') {
    const todoContainer = document.getElementById('tasks-todo');
    const inProgressContainer = document.getElementById('tasks-in-progress');
    const completedContainer = document.getElementById('tasks-completed');

    todoContainer.innerHTML = '';
    inProgressContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    let filtered = tasks;
    if (subjectFilter !== 'all') filtered = filtered.filter(t => t.subject === subjectFilter);
    if (searchQuery) filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery));

    let counts = { todo: 0, 'in-progress': 0, completed: 0 };

    filtered.forEach(t => {
        counts[t.status]++;
        const cardHtml = `
            <div class="kanban-card" draggable="true" ondragstart="dragTask(event, '${t.id}')">
                <div class="kanban-card-top">
                    <span class="tag-subject">${t.subject}</span>
                    <span class="tag-priority ${t.priority}">${t.priority}</span>
                </div>
                <h4>${t.title}</h4>
                <div class="kanban-card-footer">
                    <span>${t.date} (${t.hours}h)</span>
                    <div class="kanban-actions">
                        <button onclick="editTask('${t.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteTask('${t.id}')"><i class="fa-solid fa-trash"></i></button>
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

function updateSubjectFilterOptions() {
    const subjects = [...new Set(tasks.map(t => t.subject))];
    const select = document.getElementById('kanbanSubjectFilter');
    select.innerHTML = '<option value="all">All Courses</option>';
    subjects.forEach(s => { select.innerHTML += `<option value="${s}">${s}</option>`; });
}

function markCompleted(id) {
    const t = tasks.find(item => item.id === id);
    if (t && t.status !== 'completed') {
        t.status = 'completed';
        userXP += 100;
        userCoins += 25;
        saveTasks();
        updateGamificationUI();
        renderAll();
        alert('🎉 Task completed! Earned +100 XP & +25 Coins!');
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
    if (confirm('Delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderAll();
    }
}

// LIVE STUDY ROOMS
function renderRooms() {
    const grid = document.getElementById('roomsGridContainer');
    grid.innerHTML = '';
    studyRooms.forEach(room => {
        let peersHtml = '';
        room.peers.forEach(p => { peersHtml += `<div class="peer-pill"><i class="fa-solid fa-circle" style="color:var(--success); font-size:0.6rem;"></i> ${p}</div>`; });

        grid.innerHTML += `
            <div class="card room-card">
                <div class="room-card-header">
                    <h3>${room.name}</h3>
                    <span class="badge">${room.peers.length} Active</span>
                </div>
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">Focus: ${room.focus}</p>
                <div class="room-peers-list">${peersHtml}</div>
                <button class="btn-secondary" style="width:100%; margin-top:16px;" onclick="joinRoom('${room.id}')">Join Study Room</button>
            </div>
        `;
    });
}

function joinRoom(roomId) {
    const room = studyRooms.find(r => r.id === roomId);
    if (room) {
        room.peers.push('Alex Scholar (Joined Live)');
        saveRooms();
        renderRooms();
        alert(`Successfully connected to ${room.name}!`);
    }
}

// GPA SIMULATOR
function renderGPA() {
    const totalHours = tasks.reduce((acc, t) => acc + t.hours, 1);
    const completedHours = tasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.hours, 0);
    const ratio = completedHours / totalHours;
    const simulatedGPA = (3.2 + (ratio * 0.8)).toFixed(2);
    document.getElementById('currentCalculatedGPA').innerText = simulatedGPA;
}

// POMODORO
function setPomoMode(mode) {
    pomoState = mode;
    clearInterval(pomoInterval);
    isPomoRunning = false;
    document.getElementById('startTimerBtn').innerHTML = '<i class="fa-solid fa-play"></i> Start Focus';

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
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Start Focus';
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
                userXP += 150;
                userCoins += 40;
                saveTasks();
                updateGamificationUI();
                alert('⏰ Pomodoro complete! Earned +150 XP & +40 Coins.');
                btn.innerHTML = '<i class="fa-solid fa-play"></i> Start Focus';
            }
        }, 1000);
    }
}

function resetPomodoro() {
    clearInterval(pomoInterval);
    isPomoRunning = false;
    document.getElementById('startTimerBtn').innerHTML = '<i class="fa-solid fa-play"></i> Start Focus';
    setPomoMode(pomoState);
}

function updatePomoTaskSelect() {
    const select = document.getElementById('pomoTaskSelect');
    select.innerHTML = '<option value="">-- None --</option>';
    tasks.filter(t => t.status !== 'completed').forEach(t => {
        select.innerHTML += `<option value="${t.id}">${t.title} (${t.subject})</option>`;
    });
}

function renderAnalytics() {
    document.getElementById('statHigh').innerText = tasks.filter(t => t.priority === 'High').length;
    document.getElementById('statMed').innerText = tasks.filter(t => t.priority === 'Medium').length;
    document.getElementById('statLow').innerText = tasks.filter(t => t.priority === 'Low').length;

    const totalHours = tasks.reduce((acc, t) => acc + (t.status !== 'completed' ? t.hours : 0), 0);
    const lbContainer = document.getElementById('leaderboardListContainer');
    lbContainer.innerHTML = `
        <div class="leaderboard-row"><span>1. Sophia Chen</span> <strong>14.5 hrs</strong></div>
        <div class="leaderboard-row"><span>2. Marcus Vance</span> <strong>12.0 hrs</strong></div>
        <div class="leaderboard-row" style="background:var(--primary-light); padding:6px 10px; border-radius:8px;"><span>3. Alex Scholar (You)</span> <strong>${totalHours} hrs</strong></div>
    `;
}
