const todayStr = new Date().toISOString().split('T')[0];

let tasks = JSON.parse(localStorage.getItem('acad_tasks')) || [
    { id: '1', title: 'Data Structures Assignment 3', subject: 'Computer Science', priority: 'High', date: todayStr, hours: 3, status: 'todo' },
    { id: '2', title: 'Organic Chemistry Lab Report', subject: 'Chemistry', priority: 'Medium', date: todayStr, hours: 2.5, status: 'in-progress' }
];

let userXP = parseInt(localStorage.getItem('acad_xp')) || 450;
let userCoins = parseInt(localStorage.getItem('acad_coins')) || 120;

let currentTheme = localStorage.getItem('acad_theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
if (currentTheme === 'dark') {
    document.getElementById('themeToggle').innerHTML = '<i class="fa-solid fa-sun"></i> <span>Light Mode</span>';
}

// WebRTC PeerJS & Media Streams
let peer = null;
let localStream = null;
let activeConnection = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
    initWebRTCVideoRoom();
});

function initApp() {
    updateDateDisplay();
    updateGamificationUI();
    renderAll();
}

function saveTasks() {
    localStorage.setItem('acad_tasks', JSON.stringify(tasks));
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
    renderGPA();
    renderAnalytics();
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

    // Copy Peer ID Button
    document.getElementById('copyIdBtn').addEventListener('click', () => {
        const idInput = document.getElementById('myPeerIdInput');
        idInput.select();
        navigator.clipboard.writeText(idInput.value);
        alert('Copied Peer ID to clipboard!');
    });

    // Call Peer Button
    document.getElementById('callPeerBtn').addEventListener('click', () => {
        const targetId = document.getElementById('targetPeerIdInput').value.trim();
        if (!targetId) {
            alert('Please enter a valid Peer ID to call.');
            return;
        }
        if (peer && localStream) {
            const call = peer.call(targetId, localStream);
            call.on('stream', (remoteStream) => {
                document.getElementById('remoteVideo').srcObject = remoteStream;
            });

            // Also open data connection for chat
            activeConnection = peer.connect(targetId);
            setupDataConnection();
            alert('Calling peer...');
        }
    });

    // Send Chat
    document.getElementById('sendChatBtn').addEventListener('click', sendRoomMessage);
}

// WEBRTC VIDEO & DATA INITIALIZATION
async function initWebRTCVideoRoom() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
    } catch (err) {
        console.error('Webcam access error:', err);
        alert('Could not access webcam/microphone. Please check browser permissions.');
    }

    peer = new Peer();
    peer.on('open', (id) => {
        document.getElementById('myPeerIdInput').value = id;
    });

    // Receive incoming calls
    peer.on('call', (call) => {
        if (confirm('Incoming video call from study peer! Accept?')) {
            call.answer(localStream);
            call.on('stream', (remoteStream) => {
                document.getElementById('remoteVideo').srcObject = remoteStream;
            });
        }
    });

    // Receive incoming chat data connections
    peer.on('connection', (conn) => {
        activeConnection = conn;
        setupDataConnection();
        appendChatSystemMessage('A peer connected to your room!');
    });
}

function setupDataConnection() {
    if (!activeConnection) return;
    activeConnection.on('data', (data) => {
        appendChatMessage(data.sender, data.text);
    });
}

function sendRoomMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    appendChatMessage('You', text);
    if (activeConnection && activeConnection.open) {
        activeConnection.send({ sender: 'Study Peer', text: text });
    }
    input.value = '';
}

function appendChatMessage(sender, text) {
    const box = document.getElementById('chatMessages');
    box.innerHTML += `<div><strong>${sender}:</strong> ${text}</div>`;
    box.scrollTop = box.scrollHeight;
}

function appendChatSystemMessage(text) {
    const box = document.getElementById('chatMessages');
    box.innerHTML += `<div style="color: var(--primary); font-style: italic;">${text}</div>`;
    box.scrollTop = box.scrollHeight;
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

function renderBalancer() {
    const grid = document.getElementById('weekDistributionGrid');
    grid.innerHTML = '';
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        const dayTasks = tasks.filter(t => t.date === dateStr && t.status !== 'completed');
        const dayHours = dayTasks.reduce((acc, t) => acc + t.hours, 0);

        let tasksHtml = '';
        dayTasks.forEach(t => {
            tasksHtml += `
                <div class="advanced-task-pill">
                    <strong>${t.title}</strong>
                    <span>${t.subject} • ${t.hours}h</span>
                </div>
            `;
        });
        if (dayTasks.length === 0) tasksHtml = '<span style="color:var(--text-muted); font-size:0.75rem;">No tasks</span>';

        grid.innerHTML += `
            <div class="day-column">
                <div class="day-header">
                    <h4>${dayLabel}</h4>
                    <span>${dayHours}h load</span>
                </div>
                <div class="day-tasks-list">${tasksHtml}</div>
            </div>
        `;
    }
}

function renderKanban() {
    const todoContainer = document.getElementById('tasks-todo');
    const inProgressContainer = document.getElementById('tasks-in-progress');
    const completedContainer = document.getElementById('tasks-completed');

    todoContainer.innerHTML = '';
    inProgressContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    let counts = { todo: 0, 'in-progress': 0, completed: 0 };

    tasks.forEach(t => {
        counts[t.status]++;
        const cardHtml = `
            <div class="kanban-card">
                <h4>${t.title}</h4>
                <span style="font-size:0.8rem; color:var(--text-muted);">${t.subject} (${t.hours}h)</span>
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

function allowDrop(ev) { ev.preventDefault(); }
function dropTask(ev, newStatus) {
    // Basic kanban drop stub
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

function renderGPA() {
    const totalHours = tasks.reduce((acc, t) => acc + t.hours, 1);
    const completedHours = tasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.hours, 0);
    const ratio = completedHours / totalHours;
    document.getElementById('currentCalculatedGPA').innerText = (3.2 + (ratio * 0.8)).toFixed(2);
}

function renderAnalytics() {
    document.getElementById('statHigh').innerText = tasks.filter(t => t.priority === 'High').length;
    document.getElementById('statMed').innerText = tasks.filter(t => t.priority === 'Medium').length;
    document.getElementById('statLow').innerText = tasks.filter(t => t.priority === 'Low').length;
}
