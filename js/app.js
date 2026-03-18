import { emotions } from './data.js';
import { initSchedule } from './schedule.js';

// DOM Elements
const welcomeSection = document.getElementById('welcome-section');
const emotionsSection = document.getElementById('emotions-section');
const verseSection = document.getElementById('verse-section');
const scheduleSection = document.getElementById('schedule-section');

const startBtn = document.getElementById('start-btn');
const emotionsGrid = document.getElementById('emotions-grid');
const backBtn = document.getElementById('back-btn');
const newVerseBtn = document.getElementById('new-verse-btn');

const openScheduleBtn = document.getElementById('open-schedule-btn');
const scheduleBackBtn = document.getElementById('schedule-back-btn');

const verseText = document.getElementById('verse-text');
const verseReference = document.getElementById('verse-reference');

// State
let currentEmotion = null;

// Navigation Functions
function switchSection(fromSection, toSection) {
    fromSection.classList.remove('active');

    // Wait for opacity transition to finish (500ms matches CSS --transition-medium)
    setTimeout(() => {
        fromSection.classList.add('hidden');
        toSection.classList.remove('hidden');
        // Force reflow
        void toSection.offsetWidth;
        toSection.classList.add('active');
    }, 500);
}

// Initialization
function init() {
    renderEmotions();
    setupEventListeners();
    initSchedule();
}

function renderEmotions() {
    emotionsGrid.innerHTML = '';
    emotions.forEach(emotion => {
        const card = document.createElement('div');
        card.className = 'emotion-card';
        // Add icon
        card.innerHTML = `
            <div class="emotion-icon">${emotion.icon}</div>
            <span class="emotion-label">${emotion.label}</span>
        `;
        card.addEventListener('click', () => handleEmotionSelect(emotion));
        emotionsGrid.appendChild(card);
    });
}

function setupEventListeners() {
    startBtn.addEventListener('click', () => {
        switchSection(welcomeSection, emotionsSection);
    });

    backBtn.addEventListener('click', () => {
        // Reset theme
        document.body.style.background = 'var(--color-bg)';
        document.body.style.color = 'var(--color-text-main)';

        switchSection(verseSection, emotionsSection);
        currentEmotion = null;
    });

    newVerseBtn.addEventListener('click', () => {
        if (currentEmotion) {
            showRandomVerse(currentEmotion);
        }
    });

    // Schedule Navigation
    openScheduleBtn.addEventListener('click', () => {
        switchSection(emotionsSection, scheduleSection);
    });

    scheduleBackBtn.addEventListener('click', () => {
        switchSection(scheduleSection, emotionsSection);
    });
}

function handleEmotionSelect(emotion) {
    currentEmotion = emotion;
    applyTheme(emotion.theme);
    showRandomVerse(emotion);
    switchSection(emotionsSection, verseSection);
}

function applyTheme(theme) {
    document.body.style.background = theme.background;
    // We might want to adjust text color based on background, but for now we keep it simple or use the theme's text color if provided
    if (theme.textColor) {
        verseSection.style.color = theme.textColor;
        // Update buttons to match theme if needed
    }
}

function showRandomVerse(emotion) {
    const verses = emotion.verses;
    const randomIndex = Math.floor(Math.random() * verses.length);
    const verse = verses[randomIndex];

    // Animate out
    verseText.style.opacity = 0;
    verseReference.style.opacity = 0;

    setTimeout(() => {
        verseText.textContent = `"${verse.text}"`;
        verseReference.textContent = verse.reference;

        // Animate in
        verseText.style.opacity = 1;
        verseReference.style.opacity = 1;
    }, 300);
}

// Start the app
init();
