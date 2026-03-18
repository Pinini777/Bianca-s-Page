// Schedule Logic

// State
import { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from './firebase-config.js';

// State
let currentDay = new Date().getDay(); // 0 = Sun
let currentView = 'day'; // 'day' or 'week'
let events = [];

const HOURS_IN_DAY = 24;
const PIXELS_PER_HOUR = 60; // Matches CSS

// DOM Elements
const scheduleSection = document.getElementById('schedule-section');
const eventsContainer = document.getElementById('events-container');
const timeColumn = document.querySelector('.time-column');

const dailyNav = document.getElementById('daily-nav');
const daysRow = document.getElementById('days-row');
const weeklyHeader = document.getElementById('weekly-header');

const viewDayBtn = document.getElementById('view-day-btn');
const viewWeekBtn = document.getElementById('view-week-btn');

const currentTimeDisplay = document.getElementById('current-time');
const currentDayName = document.getElementById('current-day-name');

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
    startClock();
    setupEventListeners();
    updateView(); // Initial Render
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
    // Navigation
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

    // View Toggles
    viewDayBtn.addEventListener('click', () => switchView('day'));
    viewWeekBtn.addEventListener('click', () => switchView('week'));

    // Modal
    addEventBtn.addEventListener('click', () => openModal());
    cancelEventBtn.addEventListener('click', () => closeModal());
    deleteEventBtn.addEventListener('click', deleteCurrentEvent);
    
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });
}

// --- Logic ---

function changeDay(index) {
    currentDay = index;
    // If we are in week view, changing day might just highlight column? 
    // For simplicity, stay in current view but update state.
    if (currentView === 'day') {
        updateView();
    }
}

function switchView(view) {
    currentView = view;
    
    if (view === 'day') {
        viewDayBtn.classList.add('active');
        viewWeekBtn.classList.remove('active');
        dailyNav.classList.remove('hidden');
        weeklyHeader.classList.add('hidden');
        eventsContainer.classList.remove('week-view');
    } else {
        viewWeekBtn.classList.add('active');
        viewDayBtn.classList.remove('active');
        dailyNav.classList.add('hidden');
        weeklyHeader.classList.remove('hidden');
        eventsContainer.classList.add('week-view');
    }

    renderEvents();
}

function updateView() {
    // Update Header Text (Day View Only)
    const daysFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    if (currentDayName) currentDayName.textContent = daysFull[currentDay];

    // Update Tabs
    const tabs = document.querySelectorAll('.day-tab');
    
    tabs.forEach((tab, idx) => {
        if (idx === currentDay) {
            tab.classList.add('active');
            
            // Auto-scroll logic: Center the active tab
            const scrollLeft = tab.offsetLeft - (daysRow.offsetWidth / 2) + (tab.offsetWidth / 2);
            daysRow.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            
        } else {
            tab.classList.remove('active');
        }
    });

    // Weekend Styling (Day View Only)
    if (currentView === 'day') {
        if (currentDay === 0 || currentDay === 6) {
            eventsContainer.classList.add('is-weekend');
        } else {
            eventsContainer.classList.remove('is-weekend');
        }
    } else {
        eventsContainer.classList.remove('is-weekend'); // Week view has mixed days
    }

    renderEvents();
}

function renderEvents() {
    // Clear existing events (keep grid lines)
    const existingEvents = document.querySelectorAll('.event-card');
    existingEvents.forEach(el => el.remove());

    let eventsToRender = [];

    if (currentView === 'day') {
        // Filter for current day
        eventsToRender = events.filter(e => parseInt(e.day) === currentDay);
    } else {
        // Show all events
        eventsToRender = events;
    }

    eventsToRender.forEach(event => {
        const el = document.createElement('div');
        el.className = `event-card event-${event.color || 'blue'}`;
        
        // Calculate Vertical Position
        const [startH, startM] = event.start.split(':').map(Number);
        const [endH, endM] = event.end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const duration = (endH * 60 + endM) - startMinutes;

        const top = (startMinutes / 60) * PIXELS_PER_HOUR;
        const height = (duration / 60) * PIXELS_PER_HOUR;

        el.style.top = `${top}px`;
        el.style.height = `${height}px`;

        // Calculate Horizontal Position
        if (currentView === 'day') {
            el.style.left = '5px';
            el.style.right = '5px';
            el.style.width = 'auto';
        } else {
            // Week View: Calculate width based on 7 columns
            const dayIndex = parseInt(event.day);
            const colWidth = 100 / 7;
            el.style.left = `${dayIndex * colWidth}%`;
            el.style.width = `${colWidth}%`;
            // Add margin inside the column
            el.style.borderLeft = '2px solid rgba(0,0,0,0.1)'; 
            // In week view, reduce padding/text size
            el.style.padding = '2px';
            el.style.fontSize = '0.6rem';
        }

        // Content
        if (currentView === 'day') {
             el.innerHTML = `
                <span class="event-title">${event.title}</span>
                <span class="event-time">${event.start} - ${event.end}</span>
            `;
        } else {
            // Week View: Minimal Content
             el.innerHTML = `<span class="event-title" style="white-space:nowrap; overflow:hidden;">${event.title}</span>`;
        }

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
            renderEvents(); // Re-render when data comes in
        });
    } else {
        // LocalStorage Mode
        const stored = localStorage.getItem('refugio_schedule');
        if (stored) {
            events = JSON.parse(stored);
        } else {
            events = [];
        }
        renderEvents();
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
                const eventRef = doc(db, "events", eventId);
                await updateDoc(eventRef, formData);
            } else {
                await addDoc(collection(db, "events"), formData);
            }
        } catch (e) {
            console.error("Error al guardar en Firebase:", e);
            alert("Error al guardar: " + e.message);
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
        
        // Update View immediately
        if (currentDay !== formData.day && currentView === 'day') {
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
            try {
                await deleteDoc(doc(db, "events", id));
            } catch (e) {
                console.error("Error removing document: ", e);
            }
        } else {
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
        
        const radios = document.querySelectorAll('input[name="event-color"]');
        radios.forEach(r => {
            if (r.value === event.color) r.checked = true;
        });

        deleteEventBtn.classList.remove('hidden');
    } else {
        eventForm.reset();
        idInput.value = '';
        dayInput.value = currentView === 'day' ? currentDay : 0; // Default to Sunday if in week view, or current day
        
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
    
    if(currentTimeDisplay) currentTimeDisplay.textContent = `${hours.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}`;

    // Update Line Position
    const totalMinutes = hours * 60 + mins;
    const top = (totalMinutes / 60) * PIXELS_PER_HOUR;
    currentTimeLine.style.top = `${top}px`;

    // Show line logic
    const todayIndex = new Date().getDay();
    if (currentView === 'week') {
         currentTimeLine.style.display = 'block';
         // In week view, line should span full width? Yes, simple implementation
    } else {
        if (todayIndex === currentDay) {
            currentTimeLine.style.display = 'block';
        } else {
            currentTimeLine.style.display = 'none';
        }
    }
}
