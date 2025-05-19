// script.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const noteArea = document.getElementById('noteArea');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = themeToggleBtn.querySelector('.material-symbols-outlined');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const wordCountDisplay = document.getElementById('wordCount');
    const toastNotification = document.getElementById('toastNotification');

    // --- Persisted State ---
    const NOTE_STORAGE_KEY = 'quickNotesContent';
    const THEME_STORAGE_KEY = 'quickNotesTheme';

    // --- Event Listeners ---

    // Note Area: Save content and update word count on input
    noteArea.addEventListener('input', () => {
        localStorage.setItem(NOTE_STORAGE_KEY, noteArea.value);
        updateWordCount();
    });

    // Theme Toggle Button
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Copy Button
    copyBtn.addEventListener('click', copyText);

    // Clear Button
    clearBtn.addEventListener('click', clearText);

    // --- Functions ---

    // Word Count
    function updateWordCount() {
        const text = noteArea.value.trim();
        const words = text === '' ? 0 : text.split(/\s+/).length;
        wordCountDisplay.textContent = `Words: ${words}`;
    }

    // Theme Management
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
        updateThemeIcon(isDarkMode);
        updateMetaThemeColor(isDarkMode);
    }

    function applyInitialTheme() {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        let isDarkMode = false;

        if (savedTheme) {
            isDarkMode = savedTheme === 'dark';
        } else {
            // Fallback to system preference if no theme is saved
            isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        updateThemeIcon(isDarkMode);
        updateMetaThemeColor(isDarkMode);
    }

    function updateThemeIcon(isDarkMode) {
        if (themeIcon) {
            themeIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';
            themeToggleBtn.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
            themeToggleBtn.setAttribute('title', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
        }
    }

    function updateMetaThemeColor(isDarkMode) {
        // Update the meta theme-color tag for browser UI consistency
        let lightThemeMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
        let darkThemeMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
        
        // If these specific media query metas don't exist, try to find a general one or create it.
        // For simplicity with the provided HTML, we'll assume they exist.
        // A more robust solution might involve a single theme-color meta tag and updating its content.
        // However, the current HTML setup with media queries is also a valid approach.
        // The PWA manifest theme_color will be used on app launch.
        // This JS update is for when the theme is changed *while the app is open*.
        
        // To ensure the browser picks up the change immediately, we can have a primary meta tag
        // and update its content. Let's try that.
        let primaryThemeColorMeta = document.querySelector('meta[name="theme-color"]:not([media])');
        if (!primaryThemeColorMeta) {
            primaryThemeColorMeta = document.createElement('meta');
            primaryThemeColorMeta.name = "theme-color";
            document.head.appendChild(primaryThemeColorMeta);
        }
        primaryThemeColorMeta.content = isDarkMode ? '#141218' : '#FFFBFE'; // Match CSS dark/light bg
    }


    // Copy Text
    async function copyText() {
        if (!noteArea.value) {
            showToast('Nothing to copy!');
            return;
        }
        try {
            await navigator.clipboard.writeText(noteArea.value);
            showToast('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy.');
        }
    }

    // Clear Text
    function clearText() {
        noteArea.value = '';
        localStorage.removeItem(NOTE_STORAGE_KEY); // Also clear from storage
        updateWordCount();
        showToast('Notes cleared!');
    }

    // Toast Notification
    let toastTimeout;
    function showToast(message) {
        if (toastNotification) {
            toastNotification.textContent = message;
            toastNotification.classList.add('show');
            clearTimeout(toastTimeout); // Clear existing timeout if any
            toastTimeout = setTimeout(() => {
                toastNotification.classList.remove('show');
            }, 3000); // Hide after 3 seconds
        }
    }

    // Load saved notes
    function loadSavedNotes() {
        const savedNotes = localStorage.getItem(NOTE_STORAGE_KEY);
        if (savedNotes) {
            noteArea.value = savedNotes;
        }
    }

    // --- Initialization ---
    loadSavedNotes();
    applyInitialTheme();
    updateWordCount(); // Initial word count

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
});
