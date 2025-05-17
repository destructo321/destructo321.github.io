document.addEventListener('DOMContentLoaded', () => {
    const noteArea = document.getElementById('note-area');
    const clearButton = document.getElementById('clear-button');
    const copyButton = document.getElementById('copy-button');
    const themeToggleButton = document.getElementById('theme-toggle');
    const wordCountElement = document.getElementById('word-count');
    const body = document.body;
    const controlsContainer = document.querySelector('.controls-container');

    // Store the initial padding-bottom of the textarea from CSS
    const initialNoteAreaPaddingBottom = getComputedStyle(noteArea).paddingBottom;

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

    // --- Keyboard Visibility and Layout Adjustment ---

    const adjustLayout = () => {
        if (window.visualViewport) {
            const visualViewportHeight = window.visualViewport.height;
            const visualViewportBottom = window.visualViewport.offsetTop + visualViewportHeight;
            const layoutViewportHeight = window.innerHeight;

            // Calculate the space below the visual viewport (likely keyboard + browser UI)
            const spaceBelowVisualViewport = layoutViewportHeight - visualViewportBottom;

            // Adjust the bottom position of the controls container
            // It should be positioned relative to the bottom of the visual viewport
            // Add some padding (e.g., 16px) above the visual viewport bottom
            controlsContainer.style.bottom = `${spaceBelowVisualViewport + 16}px`;

            // Calculate the available height for the textarea
            // This is the visual viewport height minus the height of the controls container
            // and any desired padding above the controls.
            const controlsHeight = controlsContainer.offsetHeight;
            const availableHeightForTextarea = visualViewportHeight - controlsHeight - 24; // 24px extra padding above controls

            // Set the height of the textarea
            noteArea.style.height = `${availableHeightForTextarea}px`;
            // Also ensure padding bottom is set to 0 when height is fixed by JS
            noteArea.style.paddingBottom = '0';


        } else {
            // Fallback for browsers that don't support visualViewport
            console.warn("visualViewport API not supported. Layout adjustment may be limited.");
            // Revert textarea height to default (flex-grow) and apply initial padding
            noteArea.style.height = ''; // Remove inline height style
            noteArea.style.paddingBottom = initialNoteAreaPaddingBottom;
             // Controls position remains the default fixed bottom set in CSS
             controlsContainer.style.bottom = `16px`; // Ensure default bottom is set
        }
    };

    const resetLayout = () => {
        // Reset controls bottom position to default CSS value
        controlsContainer.style.bottom = `16px`; // Reset to CSS default
        // Reset textarea height and padding bottom to default CSS/flexbox behavior
        noteArea.style.height = ''; // Remove inline height style
        noteArea.style.paddingBottom = initialNoteAreaPaddingBottom;
    };


    // Listen for focus and blur events on the textarea
    noteArea.addEventListener('focus', adjustLayout);
    noteArea.addEventListener('blur', resetLayout);


     // Also listen for visualViewport resize in case keyboard behaviour is different
     // or for device orientation changes while keyboard is active
     if (window.visualViewport) {
         window.visualViewport.addEventListener('resize', () => {
             // Only adjust if the textarea is currently focused or if the visual viewport height changes significantly
             // (e.g., device rotation)
             if (document.activeElement === noteArea || window.visualViewport.height !== window.innerHeight) {
                  adjustLayout();
             } else {
                 // If not focused and visual viewport height matches layout, reset
                 resetLayout();
             }
         });
     }

     // Listen for window resize as well, in case visualViewport resize isn't enough
     window.addEventListener('resize', () => {
          // Only adjust if the textarea is currently focused or if the window height changes significantly
         if (document.activeElement === noteArea || window.innerHeight !== window.visualViewport?.height) {
             adjustLayout();
         } else {
              resetLayout();
         }
     });


    // Initial layout adjustment on load
    // Use a small delay to ensure elements are rendered and styles are applied
    setTimeout(() => {
        // Check if textarea is focused or if initial visual viewport height is different
        if (document.activeElement === noteArea || (window.visualViewport && window.visualViewport.height !== window.innerHeight)) {
             adjustLayout();
        } else {
              resetLayout();
        }
    }, 100); // Adjust delay if needed


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
