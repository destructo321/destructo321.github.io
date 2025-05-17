document.addEventListener('DOMContentLoaded', () => {
    const noteArea = document.getElementById('note-area');
    const clearButton = document.getElementById('clear-button');
    const copyButton = document.getElementById('copy-button');
    const themeToggleButton = document.getElementById('theme-toggle');
    const wordCountElement = document.getElementById('word-count');
    const body = document.body;
    const controlsContainer = document.querySelector('.controls-container');

    // --- Local Storage Persistence ---
    // Load note content from local storage on page load
    const savedNote = localStorage.getItem('scratchpadNote');
    if (savedNote) {
        noteArea.value = savedNote;
        updateWordCount(); // Update word count for loaded content
    }

    // Save note content to local storage whenever it changes
    noteArea.addEventListener('input', () => {
        localStorage.setItem('scratchpadNote', noteArea.value);
        updateWordCount(); // Update word count on input
    });

    // Load theme preference from local storage
    const savedTheme = localStorage.getItem('themePreference');
    if (savedTheme) {
        body.className = savedTheme; // Apply saved theme class
        updateThemeToggleIcon(savedTheme); // Update the icon
        updateThemeColorMetaTag(savedTheme); // Update theme color meta tag
    } else {
        // Default to light mode if no preference is saved
        body.className = 'light-mode';
        updateThemeToggleIcon('light-mode');
        updateThemeColorMetaTag('light-mode');
    }


    // --- Functionality ---

    // Clear button functionality
    clearButton.addEventListener('click', () => {
        noteArea.value = '';
        localStorage.removeItem('scratchpadNote'); // Also clear from local storage
        updateWordCount(); // Reset word count
        // Optional: Focus the textarea after clearing
        noteArea.focus();
    });

    // Copy button functionality
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(noteArea.value);
            // Optional: Provide user feedback (e.g., a temporary message)
            console.log('Content copied to clipboard!'); // For debugging
            // A simple way to show feedback could be changing the icon temporarily
            const copyIcon = copyButton.querySelector('.material-icons');
            copyIcon.textContent = 'check'; // Change icon to a checkmark
            setTimeout(() => {
                copyIcon.textContent = 'content_copy'; // Change back after a delay
            }, 1500);
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Optional: Show an error message to the user
        }
    });

    // Theme toggle functionality
    themeToggleButton.addEventListener('click', () => {
        if (body.classList.contains('light-mode')) {
            body.className = 'dark-mode';
            localStorage.setItem('themePreference', 'dark-mode');
            updateThemeToggleIcon('dark-mode');
            updateThemeColorMetaTag('dark-mode');
        } else {
            body.className = 'light-mode';
            localStorage.setItem('themePreference', 'light-mode');
            updateThemeToggleIcon('light-mode');
            updateThemeColorMetaTag('light-mode');
        }
    });

    // Function to update the theme toggle icon
    function updateThemeToggleIcon(currentTheme) {
        const icon = themeToggleButton.querySelector('.material-icons');
        if (currentTheme === 'light-mode') {
            icon.textContent = 'dark_mode'; // Show dark mode icon in light mode
        } else {
            icon.textContent = 'light_mode'; // Show light mode icon in dark mode
        }
    }

     // Function to update the theme-color meta tag for PWA
    function updateThemeColorMetaTag(currentTheme) {
        const metaThemeColor = document.querySelector('meta[name=theme-color]');
        if (currentTheme === 'light-mode') {
            // Use a color that works well with the light mode header/status bar
             metaThemeColor.setAttribute('content', '#FFFBFF'); // Light surface color
        } else {
             // Use a color that works well with the dark mode header/status bar
            metaThemeColor.setAttribute('content', '#000000'); // Black background color
        }
    }


    // Function to update word count
    function updateWordCount() {
        const text = noteArea.value.trim(); // Remove leading/trailing whitespace
        if (text === '') {
            wordCountElement.textContent = '0 words';
        } else {
            const words = text.split(/\s+/).filter(word => word.length > 0); // Split by whitespace and filter empty strings
            wordCountElement.textContent = `${words.length} words`;
        }
    }

    // Initial word count update on page load
    updateWordCount();

    // --- Keyboard Visibility / Visual Viewport Handling ---
    // Adjust the position of the controls container when the visual viewport resizes
    // This helps keep controls above the on-screen keyboard
    if (window.visualViewport) {
        const adjustControlsPosition = () => {
            const visualViewportHeight = window.visualViewport.height;
            const layoutViewportHeight = window.innerHeight;

            // Calculate the difference in height (likely due to keyboard)
            const keyboardHeight = layoutViewportHeight - visualViewportHeight;

            // Adjust the bottom position of the controls container
            // Add some extra padding (e.g., 16px) above the keyboard/bottom edge
            controlsContainer.style.bottom = `${keyboardHeight + 16}px`;

            // Also adjust the padding-bottom of the textarea
            // Ensure there's enough space for the controls + padding
            const controlsHeight = controlsContainer.offsetHeight; // Get the height of the controls
             noteArea.style.paddingBottom = `${controlsHeight + keyboardHeight + 24}px`; // Add controls height, keyboard height, and extra padding
        };

        // Listen for visual viewport resize events
        window.visualViewport.addEventListener('resize', adjustControlsPosition);

        // Initial adjustment on load
        adjustControlsPosition();
    } else {
        // Fallback for browsers that don't support visualViewport (less ideal)
        console.warn("visualViewport API not supported. Controls may not stay above keyboard reliably.");
        // Keep the initial padding-bottom from CSS as a fallback
    }


    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered: ', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed: ', error);
                });
        });
    }
});
