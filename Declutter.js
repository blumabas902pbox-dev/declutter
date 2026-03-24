/*Programmer: Bryan Jay M. Lumabas*/
const taskInput = document.getElementById('taskInput');
const inputWrapper = document.getElementById('inputWrapper');
const taskList = document.getElementById('task-list');

const addBtn = document.getElementById('addBtn');       
const inlineAddBtn = document.getElementById('inlineAddBtn'); 
const sortBtn = document.getElementById('sortAsc');
const resetBtn = document.getElementById('resetBtn');

const totalCounter = document.getElementById('totalTasks');
const doneCounter = document.getElementById('doneTasks');
const editCounter = document.getElementById('editTasks');
const deleteCounter = document.getElementById('deletedTasks');

const statusDisplay = document.querySelector('.app-window p');

let tasks = JSON.parse(localStorage.getItem('declutter_tasks')) || [];
let deletedCount = parseInt(localStorage.getItem('declutter_deleted')) || 0;
let editedCount = parseInt(localStorage.getItem('declutter_edited')) || 0;
let history = []; 
let currentSort = 'asc';
let editingId = null;
let draggedItemIndex = null;

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed;
        top: 50px;
        right: 100px;
        background: ${isError ? '#474747' : '#b7b7b7'};
        color: ${isError ? '#f7f7f7' : '#171717'};
        padding: 15px 25px;
        font-family: 'Space Mono';
        font-size: 0.9rem;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = '0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

function updateEmotionalStatus() {
    const total = tasks.length;
    const latestTask = total > 0 ? tasks[tasks.length - 1].text.toLowerCase() : "";

    if (latestTask.includes("be") || latestTask.includes("party") || latestTask.includes("dance") || latestTask.includes("celebrate") || latestTask.includes("sing")) {
        statusDisplay.innerText = "STATUS: ECSTATIC";
    } else if (latestTask.includes("believe") || latestTask.includes("risk") || latestTask.includes("love") || latestTask.includes("new") || latestTask.includes("courage")) {
        statusDisplay.innerText = "STATUS: FEARLESS";
    } else if (latestTask.includes("thanks") || latestTask.includes("owe") || latestTask.includes("blessed") || latestTask.includes("appreciate") || latestTask.includes("kind")) {
        statusDisplay.innerText = "STATUS: GRATEFUL";
    } else if (latestTask.includes("dream") || latestTask.includes("learn") || latestTask.includes("bring") || latestTask.includes("become") || latestTask.includes("create")) {
        statusDisplay.innerText = "STATUS: INSPIRED";
    } else if (latestTask.includes("unwind") || latestTask.includes("breathe") || latestTask.includes("coffee") || latestTask.includes("sleep") || latestTask.includes("listen")) {
        statusDisplay.innerText = "STATUS: RELAXED";
    } else if (latestTask.includes("tired") || latestTask.includes("urgent") || latestTask.includes("heavy") || latestTask.includes("so many") || latestTask.includes("deadline")) {
        statusDisplay.innerText = "STATUS: EXHAUSTED";
    } else if (latestTask.includes("never") || latestTask.includes("can't") || latestTask.includes("tears") || latestTask.includes("sad") || latestTask.includes("lonely")) {
        statusDisplay.innerText = "STATUS: HEARTBROKEN";
    } else if (latestTask.includes("afraid") || latestTask.includes("not") || latestTask.includes("hate") || latestTask.includes("shouldn't") || latestTask.includes("worry")) {
        statusDisplay.innerText = "STATUS: INSECURE";
    } else if (latestTask.includes("remember") || latestTask.includes("when") || latestTask.includes("visiting") || latestTask.includes("back") || latestTask.includes("miss")) {
        statusDisplay.innerText = "STATUS: NOSTALGIC";
    } else if (latestTask.includes("stress") || latestTask.includes("hard") || latestTask.includes("need") || latestTask.includes("more") || latestTask.includes("too much")) {
        statusDisplay.innerText = "STATUS: OVERWHELMED";
    } 
    
    else if (total > 15) {
        statusDisplay.innerText = "STATUS: OVERWHELMED";
    } else if (total === 0) {
        statusDisplay.innerText = "STATUS: DECLUTTERING";
    } else {

        statusDisplay.innerText = "STATUS: BRAINSTORMING";
    }
}

function addTask() {
    const text = taskInput.value.trim();
    if (text === "") {
        inputWrapper.classList.add('shake-error');
        setTimeout(() => inputWrapper.classList.remove('shake-error'), 400);
        showToast("ERROR: Feeling empty! Type a task.", true);
        return;
    }
    const isDuplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
    if (isDuplicate) {
        showToast("ERROR: That particular idea is already listed!", true);
        return;
    }
    saveToHistory();
    const newTask = { id: Date.now(), text: text, completed: false };
    tasks.push(newTask);
    taskInput.value = ""; 
    showToast("SUCCESS: The thought has captured.");
    renderTasks();
}

function deleteTask(id) {
    if (editingId === id) return;
    const taskToDelete = tasks.find(t => t.id === id);
    if (confirm(`Are you sure do you want to sweep away "${taskToDelete.text}"?`)) {
        saveToHistory();
        tasks = tasks.filter(t => t.id !== id);
        deletedCount++;
        showToast("SUCCESS: The eraser was used to wipe the board successfully.");
        renderTasks();
    }
}

function toggleComplete(id) {
    if (editingId === id) return;
    saveToHistory();
    tasks = tasks.map(t => {
        if (t.id === id) t.completed = !t.completed;
        return t;
    });
    renderTasks();
}

function editTask(id) {
    editingId = id;
    renderTasks();
    const input = document.getElementById(`edit-input-${id}`);
    if (input) {
        input.focus();
        const val = input.value;
        input.value = '';
        input.value = val;
    }
}

function handleEditSave(id, newText) {
    const taskItem = tasks.find(t => t.id === id);
    const trimmedText = newText.trim();

    if (trimmedText === "") {
        showToast("ERROR: Task cannot be empty!", true);
        renderTasks();
        return;
    }

    const isDuplicate = tasks.some(t => 
        t.text.toLowerCase() === trimmedText.toLowerCase() && t.id !== id
    );

    if (isDuplicate) {
        showToast("ERROR: This particular idea already exists!", true);
        renderTasks(); 
        return;
    }

    if (trimmedText !== taskItem.text) {
        saveToHistory();
        taskItem.text = trimmedText;
        editedCount++;
        showToast("SUCCESS: Task updated.");
    }
    
    editingId = null;
    renderTasks();
}

function sortTasks() {
    if (tasks.length < 2) return showToast("ERROR: Not enough to sort ideas.", true);
    saveToHistory();
    if (currentSort === 'asc') {
        tasks.sort((a, b) => a.text.localeCompare(b.text));
        sortBtn.innerText = "SORT_DESC";
        currentSort = 'desc';
    } else if (currentSort === 'desc') {
        tasks.sort((a, b) => b.text.localeCompare(a.text));
        sortBtn.innerText = "SORT_OG";
        currentSort = 'og';
    } else {
        tasks.sort((a, b) => a.id - b.id);
        sortBtn.innerText = "SORT_ASC";
        currentSort = 'asc';
    }
    renderTasks();
}

function toggleSelectAll() {
    if (tasks.length === 0) return showToast("ERROR: There's nothing to select.", true);
    saveToHistory();
    const allDone = tasks.every(t => t.completed);
    tasks.forEach(t => t.completed = !allDone);
    showToast(allDone ? "SUCCESS: Selections are cleared." : "SUCCESS: All of ideas selected.");
    renderTasks();
}

function resetApp() {
    if (tasks.length === 0 && deletedCount === 0) return showToast("ERROR: Your state of mind is already tidy.", true);
    if (confirm("Reset everything and clear stats?")) {
        saveToHistory();
        tasks = [];
        deletedCount = 0;
        editedCount = 0;
        localStorage.clear();
        showToast("SUCCESS: Full sweeping completed.");
        renderTasks();
    }
}

function sweepCompleted() {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return showToast("ERROR: No finished tasks to sweep.", true);
    if (confirm(`Are you sure do you want to delete or sweep ${completedTasks.length} completed items?`)) {
        saveToHistory();
        deletedCount += completedTasks.length;
        tasks = tasks.filter(t => !t.completed);
        showToast(`SUCCESS: ${completedTasks.length} items swept.`);
        renderTasks();
    }
}

function saveToHistory() {
    history.push(JSON.stringify(tasks));
    if (history.length > 20) history.shift();
}

function undo() {
    if (history.length > 0) {
        tasks = JSON.parse(history.pop());
        showToast("SUCCESS: An action can be undone.");
        renderTasks();
    } else {
        showToast("ERROR: There's no reason to go back to.", true);
    }
}

function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task, index) => {
        const isEditing = editingId === task.id;
        const li = document.createElement('div');
        li.className = "task-item";
        li.draggable = !isEditing;
        li.dataset.index = index;
        
        li.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; flex-grow:1;">
                <input type="checkbox" 
                    style="
                        appearance: none;
                        -webkit-appearance: none;
                        width: 20px;
                        height: 20px;
                        cursor: pointer;
                        background-color: #2d2d2d;
                        border: 2px solid #808080;
                        border-radius: 2px;
                        display: grid;
                        place-content: center;
                        transition: all 0.2s ease;
                    "
                    ${task.completed ? 'checked' : ''} 
                    onclick="toggleComplete(${task.id})" 
                    ${isEditing ? 'disabled' : ''}>
                
                <style>
                    input[type="checkbox"]:checked {
                        background-color: #2d2d2d;
                        border-color: #4a4a4a;
                    }
                    input[type="checkbox"]::before {
                        content: "";
                        width: 10px;
                        height: 10px;
                        transform: scale(0);
                        transition: 120ms transform ease-in-out;
                        color: #2d2d2d;
                        background-color: #f2f2f2;
                        clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
                    }
                    input[type="checkbox"]:checked::before {
                        transform: scale(1);
                    }
                    
                    .task-edit-input {
                        background: transparent !important;
                        border: none !important;
                        border-bottom: 2px solid #808080 !important;
                        color: #2d2d2d;
                        font-family: 'Space Mono', monospace;
                        font-size: 1rem;
                        padding: 5px 0;
                        width: 90%;
                        outline: none !important;
                        border-radius: 0 !important;
                    }
                </style>

                ${isEditing ? 
                    `<input type="text" id="edit-input-${task.id}" 
                        class="task-edit-input"
                        value="${task.text}" 
                        onkeydown="if(event.key==='Enter') handleEditSave(${task.id}, this.value)"
                        onblur="handleEditSave(${task.id}, this.value)">` 
                    : 
                    `<span class="task-text ${task.completed ? 'completed-text' : ''}" 
                        ondblclick="editTask(${task.id})">
                        ${task.text}
                    </span>`
                }
            </div>
            <div style="display:flex; gap:10px;">
                <button class="task-action-btn" onclick="editTask(${task.id})" ${isEditing ? 'disabled style="opacity:0.5"' : ''}>
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="task-action-btn" onclick="deleteTask(${task.id})" ${isEditing ? 'disabled style="opacity:0.5"' : ''}>
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
        taskList.appendChild(li);
    });

    totalCounter.innerText = tasks.length;
    doneCounter.innerText = tasks.filter(t => t.completed).length;
    editCounter.innerText = editedCount;
    deleteCounter.innerText = deleteCounter.innerText = deletedCount;
    updateEmotionalStatus();
    localStorage.setItem('declutter_tasks', JSON.stringify(tasks));
    localStorage.setItem('declutter_deleted', deletedCount);
    localStorage.setItem('declutter_edited', editedCount);
}

taskList.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.task-item');
    if (item) { draggedItemIndex = item.dataset.index; e.target.style.opacity = "0.5"; }
});
taskList.addEventListener('dragover', (e) => e.preventDefault());
taskList.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetItem = e.target.closest('.task-item');
    if (!targetItem || draggedItemIndex === null) return;
    const droppedItemIndex = targetItem.dataset.index;
    if (draggedItemIndex !== droppedItemIndex) {
        saveToHistory();
        const movedItem = tasks.splice(draggedItemIndex, 1)[0];
        tasks.splice(droppedItemIndex, 0, movedItem);
        renderTasks();
    }
});
taskList.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('task-item')) e.target.style.opacity = "1";
    draggedItemIndex = null;
});

document.getElementById('addBtn')?.addEventListener('click', addTask);
document.getElementById('inlineAddBtn')?.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
document.getElementById('sortAsc')?.addEventListener('click', sortTasks);
document.getElementById('undoBtn')?.addEventListener('click', undo);
document.getElementById('selectAllBtn')?.addEventListener('click', toggleSelectAll);
document.getElementById('resetBtn')?.addEventListener('click', sweepCompleted);
document.getElementById('clearAllBtn')?.addEventListener('click', resetApp);
renderTasks();
;

window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && document.activeElement !== taskInput) {
        const selectedTasks = tasks.filter(t => t.completed);
        const count = selectedTasks.length;

        if (count === 0) {
            showToast("ERROR: Select tasks using checkboxes first!", true);
            return;
        }

            if (confirm(`Are you sure do you want to delete these ${count} selected tasks?`)) {
            saveToHistory();
            deletedCount += count;
            tasks = tasks.filter(t => !t.completed);
            showToast(`SUCCESS: Removed ${count} tasks.`);
            renderTasks();
        }
    }
});

let pressTimer;

taskList.addEventListener('touchstart', (e) => {
    const item = e.target.closest('.task-item');
    if (item && !editingId) {
        const index = item.dataset.index;
        const id = tasks[index].id;
        pressTimer = window.setTimeout(() => {
            editTask(id);
            if (window.navigator.vibrate) window.navigator.vibrate(50);
        }, 600);
    }
}, { passive: true });

taskList.addEventListener('touchend', () => clearTimeout(pressTimer));
taskList.addEventListener('touchmove', () => clearTimeout(pressTimer));

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();

const playSound = (type, volume = 0.5) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);

    switch(type) {
        case 'success':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
            break;
        case 'failed':
        case 'error':
        osc.type = 'square';
        osc.frequency.setValueAtTime(110, audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
        break;
        case 'pixar':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.setValueAtTime(300, audioCtx.currentTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
            break;
        case 'click':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
            break;
        case 'type':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150 + Math.random() * 50, audioCtx.currentTime);
            gain.gain.setValueAtTime(volume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.02);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.02);
            break;
    }
};

const originalShowToast = showToast;
showToast = (msg, isError = false) => {
    playSound(isError ? 'error' : 'success');
    originalShowToast(msg, isError);
};

taskInput.addEventListener('input', (e) => {
    const vol = Math.min(0.1 + (taskInput.value.length * 0.01), 0.3);
    playSound('type', vol);
});

taskList.addEventListener('input', (e) => {
    if (e.target.classList.contains('edit-input')) {
        const vol = Math.min(0.1 + (e.target.value.length * 0.01), 0.5);
        playSound('type', vol);
    }
});

document.addEventListener('click', (e) => {
    if (e.target.type === 'checkbox') {
        playSound('click');
    }
    
    if (e.target.innerText === "NOW" || e.target.closest('.now-btn')) {
        playSound('pixar');
    }

    if (e.target.closest('.task-action-btn')) {
        playSound('success', 0.2);
    }
    
    const silentBtns = ['sortAsc', 'undoBtn', 'selectAllBtn'];
    if (silentBtns.includes(e.target.id)) {
        playSound('success', 0.3);
    }
});

const originalRender = renderTasks;
renderTasks = () => {
    originalRender();
    if (!document.getElementById('completed-tasks-style')) {
        const style = document.createElement('style');
        style.id = 'completed-tasks-style';
        style.innerHTML = `
            .completed-text {
                color: white !important;
                text-shadow: 0 0 5px rgba(255,255,255,0.8);
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
};
renderTasks();

(function() {
  
    if (!document.getElementById('hero-animation-style')) {
        const style = document.createElement('style');
        style.id = 'hero-animation-style';
        style.innerHTML = `
            #heroTagline {
                display: block;
                transition: 
                    opacity 1.5s ease, 
                    max-height 1.2s cubic-bezier(0.4, 0, 0.2, 1), 
                    margin 1.2s ease,
                    transform 1.5s ease,
                    padding 1.2s ease;
                opacity: 1;
                max-height: 200px; /* Adjust based on your text height */
                overflow: hidden;
                margin-bottom: 20px;
                pointer-events: auto;
            }

            .hero-hidden {
                opacity: 0 !important;
                max-height: 0 !important;
                margin-top: 50 !important;
                margin-bottom: 50 !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                pointer-events: none;
                transform: translateY(-10px) scale(0.95);
            }
        `;
        document.head.appendChild(style);
    }
    
    const heroTagline = document.getElementById('heroTagline');

    const playVanishSound = () => {
        if (typeof audioCtx === 'undefined' || audioCtx.state === 'suspended') return;
        const now = audioCtx.currentTime;

        for (let i = 0; i < 6; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1050 + (i * 150), now + (i * 0.05));
            gain.gain.setValueAtTime(0.1, now + (i * 0.05));
            gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.05) + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + (i * 0.05));
            osc.stop(now + (i * 0.05) + 0.3);
        }
    };

    const playTadaSound = () => {
        if (typeof audioCtx === 'undefined' || audioCtx.state === 'suspended') return;
        const notes = [440, 554.37, 659.25, 880]; 
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + (i * 0.1));
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime + (i * 0.1));
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + (i * 0.1));
            osc.stop(audioCtx.currentTime + 1.0);
        });
    };

    const originalRenderTasks = renderTasks;
    renderTasks = () => {
        originalRenderTasks(); 

        if (!heroTagline) return;
        
        const total = tasks.length;
        const allDone = total > 0 && tasks.every(t => t.completed);

        if (total > 0 && !allDone) {
            if (!heroTagline.classList.contains('hero-hidden')) {
                playVanishSound();
                heroTagline.classList.add('hero-hidden');
            }
        } 

        else if (total > 0 && allDone) {
            if (heroTagline.innerHTML !== "Congratulations!<br>You Finally Did It.") {
                heroTagline.innerHTML = "Congratulations!<br>You Finally Did It.";
                playTadaSound();
            }
            heroTagline.classList.remove('hero-hidden');
        } 

        else if (total === 0) {
            heroTagline.innerHTML = "Clashing Ideas?<br>List it Out!<br>Clean Your Mind.";
            heroTagline.classList.remove('hero-hidden');
        }
    };

    renderTasks();
})();

if (!document.getElementById('declutter-dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'declutter-dynamic-styles';
    style.innerHTML = `
        .task-item {
            transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
            border: 2px solid transparent;
        }
        .task-item.drag-over {
            border: 2px dashed #808080 !important;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
            transform: scale(1.02);
            filter: blur(0.5px);
            background: rgba(255, 255, 255, 0.03);
        }
        .completed-text {
            color: white !important;
            text-shadow: 0 0 8px rgba(255,255,255,0.6);
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

const playMagicalTada = () => {
    if (typeof audioCtx === 'undefined' || audioCtx.state === 'suspended') return;
    const now = audioCtx.currentTime;
    const freqs = [587.33, 739.99, 880.00, 1174.66, 1479.98];
    freqs.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + (i * 0.02));
        g.gain.setValueAtTime(0.05, now + (i * 0.02));
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(now + (i * 0.02));
        osc.stop(now + 0.5);
    });
};

taskList.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.task-item');
    if (item) {
        draggedItemIndex = item.dataset.index;
        e.target.style.opacity = "0.4";
    }
});

taskList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const targetItem = e.target.closest('.task-item');
    
    document.querySelectorAll('.task-item').forEach(i => i.classList.remove('drag-over'));
    
    if (targetItem && targetItem.dataset.index !== draggedItemIndex) {
        targetItem.classList.add('drag-over');
    }
});

taskList.addEventListener('dragleave', (e) => {
    const targetItem = e.target.closest('.task-item');
    if (targetItem) targetItem.classList.remove('drag-over');
});

taskList.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetItem = e.target.closest('.task-item');
    if (targetItem) targetItem.classList.remove('drag-over');

    if (!targetItem || draggedItemIndex === null) return;
    const droppedItemIndex = targetItem.dataset.index;

    if (draggedItemIndex !== droppedItemIndex) {
        saveToHistory();
        const movedItem = tasks.splice(draggedItemIndex, 1)[0];
        tasks.splice(droppedItemIndex, 0, movedItem);
        
        const lyrics = ["I polish up real nice.", "Everything is shiny and new.", "Karma is a relaxing thought."];
        const randomLyric = lyrics[Math.floor(Math.random() * lyrics.length)];
        showToast(`REORDERED: ${randomLyric}`);
        
        renderTasks();
    }
});

taskList.addEventListener('dragend', (e) => {
    const item = e.target.closest('.task-item');
    if (item) item.style.opacity = "1";
    document.querySelectorAll('.task-item').forEach(i => i.classList.remove('drag-over'));
    draggedItemIndex = null;
});

document.addEventListener('click', (e) => {
    if (e.target.type === 'checkbox') {
      
        playSound('click'); 
        
        if (e.target.checked) {
            playMagicalTada();
        }
    }
});