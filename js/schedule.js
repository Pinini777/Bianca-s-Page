import { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from './firebase-config.js';

// Schedule Logic

// State
let currentDay = new Date().getDay(); // 0 = Sun, 1 = Mon...
// Adjust so 0 is Monday if we want? No, let's stick to standard JS: 0=Sun. 
// But the user might prefer Monday start. Let's handle standard 0-6.

let events = [];
const HOURS_IN_DAY = 24;
const PIXELS_PER_HOUR = 60; // Matches CSS

// DOM Elements
const scheduleSection = document.getElementById('schedule-section');
const eventsContainer = document.getElementById('events-container');
const timeColumn = document.querySelector('.time-column');
const currentDayName = document.getElementById('current-day-name');
const currentTimeDisplay = document.getElementById('current-time');
const daysRow = document.getElementById('days-row');
const prevDayBtn = document.getElementById('prev-day');
const nextDayBtn = document.getElementById('next-day');
const currentTimeLine = document.getElementById('current-time-line');

// Modal Elements
const modal = document.getElementById('event-modal');
const addEventBtn = document.getElementById('add-event-btn');
const cancelEventBtn = document.getElementById('cancel-event-btn');
const saveEventBtn = document.getElementById('save-event-btn');
const deleteEventBtn = document.getElementById('delete-event-btn');
const eventForm = document.getElementById('event-form');

// Inputs
const titleInput = document.getElementById('event-title');
const dayInput = document.getElementById('event-day');
const startInput = document.getElementById('event-start');
const endInput = document.getElementById('event-end');
const idInput = document.getElementById('event-id');

// --- Initialization ---

export function initSchedule() {
    renderTimeColumn();
    renderDayNavigation();
    loadEvents(); 
    updateView();
    startClock();
    setupEventListeners();
}

function renderTimeColumn() {
    timeColumn.innerHTML = '';
    for (let i = 0; i < HOURS_IN_DAY; i++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.textContent = `${i.toString().padStart(2, '0')}:00`;
        timeSlot.style.top = `${i * PIXELS_PER_HOUR}px`;
        timeSlot.style.position = 'absolute';
        timeSlot.style.width = '100%';
        timeColumn.appendChild(timeSlot);

        // Add grid line to events column too
        const line = document.createElement('div');
        line.className = 'grid-line';
        line.style.top = `${i * PIXELS_PER_HOUR}px`;
        eventsContainer.appendChild(line);
    }
}

function renderDayNavigation() {
    daysRow.innerHTML = '';
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    days.forEach((day, index) => {
        const btn = document.createElement('div');
        btn.className = `day-tab ${index === currentDay ? 'active' : ''}`;
        btn.textContent = day;
        btn.addEventListener('click', () => changeDay(index));
        daysRow.appendChild(btn);
    });
}

function setupEventListeners() {
    prevDayBtn.addEventListener('click', () => {
        let newDay = currentDay - 1;
        if (newDay < 0) newDay = 6;
        changeDay(newDay);
    });

    nextDayBtn.addEventListener('click', () => {
        let newDay = currentDay + 1;
        if (newDay > 6) newDay = 0;
        changeDay(newDay);
    });

    addEventBtn.addEventListener('click', () => openModal());
    cancelEventBtn.addEventListener('click', () => closeModal());
    deleteEventBtn.addEventListener('click', deleteCurrentEvent);
    
    // Form Submission
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });

    // Back button handling is done in app.js, but we can emit or handle internal state
}

// --- Logic ---

function changeDay(index) {
    currentDay = index;
    updateView();
}

function updateView() {
    // Update Header
    const daysFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    currentDayName.textContent = daysFull[currentDay];

    // Update Tabs
    const tabs = document.querySelectorAll('.day-tab');
    const daysRow = document.getElementById('days-row');
    
    tabs.forEach((tab, idx) => {
        if (idx === currentDay) {
            tab.classList.add('active');
            
            // Auto-scroll logic: Center the active tab
            // Calculate center position
            const tabRect = tab.getBoundingClientRect();
            const containerRect = daysRow.getBoundingClientRect();
            
            // If the tab is out of view (or partial), scroll it
            const scrollLeft = tab.offsetLeft - (daysRow.offsetWidth / 2) + (tab.offsetWidth / 2);
            daysRow.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            
        } else {
            tab.classList.remove('active');
        }
    });

    // Weekend Styling Logic
    // If Saturday (6) or Sunday (0), add special class
    const eventsColumn = document.getElementById('events-container');
    
    if (currentDay === 0 || currentDay === 6) {
        eventsColumn.classList.add('is-weekend');
    } else {
        eventsColumn.classList.remove('is-weekend');
    }

    // Render Events for this day
    renderEvents();
}

function renderEvents() {
    // Clear existing events (but keep grid lines and time line)
    const existingEvents = document.querySelectorAll('.event-card');
    existingEvents.forEach(el => el.remove());

    const daysEvents = events.filter(e => parseInt(e.day) === currentDay);

    daysEvents.forEach(event => {
        const el = document.createElement('div');
        el.className = `event-card event-${event.color || 'blue'}`;
        
        // Calculate Position
        const [startH, startM] = event.start.split(':').map(Number);
        const [endH, endM] = event.end.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const duration = endMinutes - startMinutes;

        const top = (startMinutes / 60) * PIXELS_PER_HOUR;
        const height = (duration / 60) * PIXELS_PER_HOUR;

        el.style.top = `${top}px`;
        el.style.height = `${height}px`;

        el.innerHTML = `
            <span class="event-title">${event.title}</span>
            <span class="event-time">${event.start} - ${event.end}</span>
        `;

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(event);
        });

        eventsContainer.appendChild(el);
    });
}

// --- Data Management (LocalStorage + Firebase) ---

function loadEvents() {
    if (db) {
        // Firebase Mode (Realtime)
        const q = collection(db, "events");
        onSnapshot(q, (snapshot) => {
            events = [];
            snapshot.forEach((doc) => {
                events.push({ id: doc.id, ...doc.data() });
            });
            updateView();
        });
    } else {
        // LocalStorage Mode
        const stored = localStorage.getItem('refugio_schedule');
        if (stored) {
            events = JSON.parse(stored);
        } else {
            events = [];
        }
        // If not using Firebase, we must call updateView immediately
        // updateView() is called in initSchedule(), so this is fine.
        // Wait, initSchedule calls loadEvents THEN updateView. 
        // Sync is async, Local is sync.
    }
}

async function saveEvent() {
    const formData = {
        title: titleInput.value,
        day: parseInt(dayInput.value),
        start: startInput.value,
        end: endInput.value,
        color: document.querySelector('input[name="event-color"]:checked').value
    };

    // Validation
    if (formData.start >= formData.end) {
        alert("La hora de fin debe ser después del inicio.");
        return;
    }

    if (db) {
        // Firebase Mode
        try {
            const eventId = idInput.value;
            if (eventId) {
                // Update
                const eventRef = doc(db, "events", eventId);
                await updateDoc(eventRef, formData);
            } else {
                // Create
                await addDoc(collection(db, "events"), formData);
            }
        } catch (e) {
            console.error("Error al guardar en Firebase:", e);
            if (e.code === 'permission-denied') {
                alert("Error de Permisos: Ve a Firebase Console > Firestore > Reglas y asegúrate de permitir lectura/escritura (allow read, write: if true;).");
            } else {
                alert("Error desconocido en la nube: " + e.message);
            }
        }
    } else {
        // LocalStorage Mode
        const eventId = idInput.value || Date.now().toString();
        const newEvent = { id: eventId, ...formData };
        
        const index = events.findIndex(e => e.id === eventId);
        if (index >= 0) {
            events[index] = newEvent;
        } else {
            events.push(newEvent);
        }
        localStorage.setItem('refugio_schedule', JSON.stringify(events));
        
        // Update View immediately since no snapshot listener
        if (currentDay !== formData.day) {
            changeDay(formData.day);
        } else {
            renderEvents();
        }
    }

    closeModal();
}

async function deleteCurrentEvent() {
    const id = idInput.value;
    if (!id) return;

    if (confirm('¿Seguro que quieres eliminar esta actividad?')) {
        if (db) {
            // Firebase Mode
            try {
                await deleteDoc(doc(db, "events", id));
            } catch (e) {
                console.error("Error removing document: ", e);
            }
        } else {
            // LocalStorage Mode
            events = events.filter(e => e.id !== id);
            localStorage.setItem('refugio_schedule', JSON.stringify(events));
            renderEvents();
        }
        closeModal();
    }
}

// --- Modal ---

function openModal(event = null) {
    if (event) {
        idInput.value = event.id;
        titleInput.value = event.title;
        dayInput.value = event.day;
        startInput.value = event.start;
        endInput.value = event.end;
        
        // Select Color
        const radios = document.querySelectorAll('input[name="event-color"]');
        radios.forEach(r => {
            if (r.value === event.color) r.checked = true;
        });

        deleteEventBtn.classList.remove('hidden');
    } else {
        // New Event defaults
        eventForm.reset();
        idInput.value = '';
        dayInput.value = currentDay;
        
        // Default time: next full hour
        const now = new Date();
        const nextHour = now.getHours() + 1;
        startInput.value = `${nextHour.toString().padStart(2,'0')}:00`;
        endInput.value = `${(nextHour + 1).toString().padStart(2,'0')}:00`;
        
        deleteEventBtn.classList.add('hidden');
    }
    
    modal.showModal();
}

function closeModal() {
    modal.close();
}

// --- Clock ---

function startClock() {
    setInterval(updateClock, 60000); // Every minute
    updateClock();
}

function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    
    currentTimeDisplay.textContent = `${hours.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}`;

    // Update Line Position
    const totalMinutes = hours * 60 + mins;
    const top = (totalMinutes / 60) * PIXELS_PER_HOUR;
    currentTimeLine.style.top = `${top}px`;

    // Only show line if it's the current day
    const todayIndex = new Date().getDay();
    if (todayIndex === currentDay) {
        currentTimeLine.style.display = 'block';
    } else {
        currentTimeLine.style.display = 'none';
    }
}
