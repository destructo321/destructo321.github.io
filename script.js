document.addEventListener('DOMContentLoaded', () => {
    const noteArea = document.getElementById('note-area');
    const themeToggle = document.getElementById('theme-toggle');
    const clearButton = document.getElementById('clear-button');
    const copyButton = document.getElementById('copy-button');
    const wordCountDisplay = document.getElementById('word-count');
    const body = document.body;

    // --- Local Storage for Persistence ---
    // Load saved note from local storage on page load
    const savedNote = localStorage.getItem('scratchpadNote');
    if (savedNote) {
        noteArea.value = savedNote;
        updateWordCount(); // Update word count for loaded text
    }

    // Load saved theme preference
    const savedTheme = localStorage.getItem('themePreference');
    if (savedTheme) {
        body.classList.add(savedTheme);
    } else {
        // Default to light mode if no preference is saved
        body.classList.add('light-mode');
    }

    // Save note to local storage whenever text area content changes
    noteArea.addEventListener('input', () => {
        localStorage.setItem('scratchpadNote', noteArea.value);
        updateWordCount(); // Update word count on input
    });

    // --- Theme Toggle Functionality ---
    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('light-mode')) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            localStorage.setItem('themePreference', 'dark-mode');
            // Change icon to reflect dark mode (e.g., sun icon)
            themeToggle.querySelector('.material-icons').textContent = 'brightness_high';
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            localStorage.setItem('themePreference', 'light-mode');
            // Change icon to reflect light mode (e.g., moon icon)
            themeToggle.querySelector('.material-icons').textContent = 'brightness_4';
        }
    });

    // Set initial icon based on current theme
    if (body.classList.contains('dark-mode')) {
        themeToggle.querySelector('.material-icons').textContent = 'brightness_high';
    } else {
        themeToggle.querySelector('.material-icons').textContent = 'brightness_4';
    }


    // --- Clear Button Functionality ---
    clearButton.addEventListener('click', () => {
        noteArea.value = '';
        localStorage.removeItem('scratchpadNote'); // Also clear from local storage
        updateWordCount(); // Reset word count
    });

    // --- Copy Button Functionality ---
    copyButton.addEventListener('click', () => {
        noteArea.select(); // Select the text in the text area
        noteArea.setSelectionRange(0, 99999); // For mobile devices

        // Use the modern Clipboard API if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(noteArea.value)
                .then(() => {
                    console.log('Text copied to clipboard');
                    // Optional: Provide user feedback (e.g., a small message)
                    // alert('Note copied to clipboard!'); // Avoid alert, use a better UI element
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    // Fallback for older browsers (less reliable)
                    try {
                        document.execCommand('copy');
                        console.log('Text copied using execCommand');
                        // alert('Note copied to clipboard!'); // Avoid alert
                    } catch (fallbackErr) {
                        console.error('Fallback copy failed: ', fallbackErr);
                        // alert('Could not copy text.'); // Avoid alert
                    }
                });
        } else {
            // Fallback for browsers that don't support the Clipboard API
            try {
                document.execCommand('copy');
                console.log('Text copied using execCommand (fallback)');
                // alert('Note copied to clipboard!'); // Avoid alert
            } catch (fallbackErr) {
                console.error('Fallback copy failed: ', fallbackErr);
                // alert('Could not copy text.'); // Avoid alert
            }
        }
    });

    // --- Word Count Functionality ---
    function updateWordCount() {
        const text = noteArea.value.trim();
        if (text === '') {
            wordCountDisplay.textContent = '0 words';
        } else {
            // Split by whitespace characters (space, tab, newline, etc.)
            const words = text.split(/\s+/).filter(word => word.length > 0);
            wordCountDisplay.textContent = `${words.length} words`;
        }
    }

    // Initial word count update on load (already handled if savedNote exists, but good to be explicit)
    // updateWordCount(); // Called after loading saved note

});
