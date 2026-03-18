# AGENTS.md - El Refugio (Project Guidelines)

This document outlines the architectural decisions, coding standards, and operational workflows for "El Refugio" (Bianca's Page). All AI agents and human contributors must adhere to these guidelines to maintain consistency, quality, and the project's spiritual intent.

## 1. Project Overview & Mission

**"El Refugio"** is a minimalist, emotionally responsive web application designed as a personal gift. Its core purpose is to provide comfort, hope, and spiritual guidance through biblical verses tailored to the user's current emotional state.

-   **Target User:** Bianca (and others seeking comfort).
-   **Core Value:** Simplicity, beauty, and spiritual connection.
-   **Translation Standard:** All biblical verses MUST be from the **Reina Valera 1960 (RVR1960)** version. No exceptions.
-   **Tone:** The application's copy and any generated content must be warm, empathetic, respectful, and rooted in Christian love.

## 2. Tech Stack & Environment

This is a **static web application**. There are no build steps, bundlers, or package managers (npm/yarn) required for standard operation.

-   **HTML5:** Semantic, accessible markup.
-   **CSS3:** Vanilla CSS with Custom Properties (Variables). No preprocessors (Sass/Less) or frameworks (Bootstrap/Tailwind) unless explicitly requested.
-   **JavaScript:** Vanilla ES6+ Modules (`type="module"`). No frameworks (React/Vue/Angular).
-   **Hosting:** GitHub Pages.
-   **Local Development:**
    1.  Clone the repository.
    2.  Open `index.html` in a modern web browser (or use a simple static server like Live Server).

## 3. Architecture & File Structure

```
/
├── index.html          # Main entry point. Contains the Welcome, Emotions, and Verse sections.
├── css/
│   └── styles.css      # Single stylesheet. Uses :root for theming and Glassmorphism effects.
├── js/
│   ├── app.js          # Main logic: DOM manipulation, event listeners, state management.
│   └── data.js         # Data layer: Array of emotion objects with verses and themes.
├── images/             # (Optional) Future directory for assets. currently root has `BIANCAPINOINICIO.jpg`.
└── README.md           # User-facing documentation.
```

## 4. Code Style & Conventions

### 4.1 HTML (`index.html`)
-   **Semantic Tags:** Use `<section>`, `<article>`, `<header>`, `<main>` where appropriate.
-   **Accessibility:**
    -   All `<img>` tags must have descriptive `alt` attributes.
    -   Interactive elements (buttons) must be keyboard accessible.
    -   Use `aria-live` regions for dynamic content updates (like the verse display).
-   **Formatting:** 2 or 4 spaces indentation. Consistent nesting.

### 4.2 CSS (`css/styles.css`)
-   **Methodology:** Functional CSS with BEM-like naming for components (e.g., `.verse-card__text`).
-   **Variables:** Use `--variable-name` in `:root` for:
    -   Colors (e.g., `--color-primary`, `--bg-gradient`).
    -   Typography (e.g., `--font-serif`).
    -   Transitions (e.g., `--transition-slow`).
-   **Responsive Design:**
    -   Mobile-First approach.
    -   Use standard breakpoints (Mobile: <768px, Tablet: 768px-1024px, Desktop: >1024px).
    -   Ensure touch targets are at least 44px on mobile.
-   **Aesthetics:** Maintain the "Glassmorphism" look:
    -   Translucent backgrounds (`rgba(255, 255, 255, 0.x)`).
    -   `backdrop-filter: blur()`.
    -   Soft, pastel gradients that change with emotions.

### 4.3 JavaScript (`js/`)
-   **Modules:** Use `import` / `export` to separate concerns (`app.js` vs `data.js`).
-   **Naming:**
    -   Variables/Functions: `camelCase` (e.g., `currentEmotion`, `renderEmotions`).
    -   Constants: `UPPER_SNAKE_CASE` for configuration values (if any).
    -   Classes: `PascalCase`.
-   **State Management:** Keep state simple. Avoid complex state machines unless necessary.
    -   Current state tracks: `activeSection`, `selectedEmotion`.
-   **Error Handling:** Fail gracefully. If a verse is missing, show a fallback or log an error without crashing the UI.

### 4.4 Data Structure (`data.js`)
-   **Emotion Object:**
    ```javascript
    {
      id: 'string',          // Unique identifier
      label: 'String',       // Display name
      description: 'String', // Subtitle
      theme: {
        background: 'css-gradient-string',
        textColor: 'hex-color',
        accentColor: 'hex-color'
      },
      verses: [
        { text: "Verse text...", reference: "Book Chapter:Verse" }
      ]
    }
    ```

## 5. Testing & Verification

Since there are no automated tests, agents must perform **manual verification** after changes:

1.  **Visual Check:** Open `index.html`. Verify layout on both Desktop (wide) and Mobile (narrow) viewports.
2.  **Flow Check:**
    -   Click "Start".
    -   Select an emotion (e.g., "Triste").
    -   Verify the background gradient changes.
    -   Verify a verse appears with the correct reference.
    -   Click "New Verse" multiple times to ensure randomization works.
    -   Click "Back" and ensure the theme resets to default.
3.  **Data Integrity:** Ensure no broken strings or missing fields in `data.js`.

## 6. Git Workflow

-   **Branching:**
    -   `main`: Production-ready code.
    -   `feat/feature-name`: For new features.
    -   `fix/issue-name`: For bug fixes.
-   **Commit Messages:**
    -   Use conventional commits: `type: description`
    -   Types: `feat`, `fix`, `docs`, `style`, `refactor`.
    -   Example: `feat: add 'Agobiada' emotion and verses`, `style: improve mobile padding on verse card`.
-   **Deployment:** Changes pushed to `main` are automatically deployed via GitHub Pages settings.

## 7. Future Improvements (Roadmap)

-   **PWA Support:** Add a `manifest.json` and Service Worker to allow installation on mobile devices.
-   **Share Functionality:** "Share this verse" button (Web Share API).
-   **Daily Verse:** A persistent "Verse of the Day" feature.
-   **Audio:** Optional soothing background ambient sound or narration.

---
*Created by OpenCode Agent for El Refugio Project.*
