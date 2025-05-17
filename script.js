document.addEventListener('DOMContentLoaded', () => {
    const noteArea = document.getElementById('note-area');
    const clearButton = document.getElementById('clear-button');
    const copyButton = document.getElementById('copy-button');
    const themeToggleButton = document.getElementById('theme-toggle');
    const wordCountElement = document.getElementById('word-count');
    const body = document.body;
    const controlsContainer = document.querySelector('.controls-container');

    // Define default bottom position for controls (when keyboard is not active)
    const defaultControlsBottom = '16px'; // Matches CSS initial value
    const defaultNoteAreaPaddingBottom = '80px'; // Matches CSS initial value

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
        // noteArea.focus(); // Avoid focusing immediately after clear if it brings up keyboard again
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
            updateThemeToggleIcon('light_mode');
            updateThemeColorMetaTag('light_mode');
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

    // --- Keyboard Visibility Handling using focus/blur ---

    // Function to adjust controls position when keyboard is likely visible
    const adjustForKeyboard = () => {
        if (window.visualViewport) {
            // Use visualViewport bottom if available
            const visualViewportBottom = window.visualViewport.offsetTop + window.visualViewport.height;
            const distanceToLayoutBottom = window.innerHeight - visualViewportBottom;

            // Position controls relative to the bottom of the layout viewport
            // Add some extra padding (e.g., 16px) above the visual viewport bottom
            controlsContainer.style.bottom = `${distanceToLayoutBottom + 16}px`;

            // Adjust textarea padding-bottom
             const controlsHeight = controlsContainer.offsetHeight;
             noteArea.style.paddingBottom = `${controlsHeight + distanceToLayoutBottom + 24}px`; // Controls height + distance + extra padding

        } else {
            // Fallback: If visualViewport is not supported, assume keyboard takes up
            // a significant portion and add extra padding at the bottom of the textarea
            // This is less precise but better than nothing.
             console.warn("visualViewport API not supported. Using fallback keyboard handling.");
             // We won't move the controls container, but we can add extra padding to the textarea
             noteArea.style.paddingBottom = `${controlsContainer.offsetHeight + 100}px`; // Add controls height + a significant buffer
        }
         controlsContainer.style.right = `16px`; // Ensure right position is maintained
         controlsContainer.style.left = `16px`; // Ensure left position is maintained
    };

    // Function to reset controls position when keyboard is likely hidden
    const resetControlsPosition = () => {
        controlsContainer.style.bottom = defaultControlsBottom;
        noteArea.style.paddingBottom = defaultNoteAreaPaddingBottom;
         controlsContainer.style.right = `16px`; // Ensure right position is maintained
         controlsContainer.style.left = `16px`; // Ensure left position is maintained
    };


    // Listen for focus and blur events on the textarea
    noteArea.addEventListener('focus', adjustForKeyboard);
    noteArea.addEventListener('blur', resetControlsPosition);

     // Also listen for visualViewport resize in case keyboard behaviour is different
     // or for device orientation changes while keyboard is active
     if (window.visualViewport) {
         window.visualViewport.addEventListener('resize', () => {
             // Only adjust if the textarea is currently focused
             if (document.activeElement === noteArea) {
                 adjustForKeyboard();
             } else {
                 // If not focused, ensure controls are in default position
                 resetControlsPosition();
             }
         });
     }


    // Initial check in case the textarea is autofocused on load
    if (document.activeElement === noteArea) {
        adjustForKeyboard();
    } else {
         resetControlsPosition();
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
