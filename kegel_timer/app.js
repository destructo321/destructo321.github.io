// app.js

// Define the exercise structure
const exercisePlan = [
    { setId: 1, reps: 12, contractDuration: 5, restDuration: 1, intensity: 'Moderate' },
    { setId: 2, reps: 12, contractDuration: 5, restDuration: 1, intensity: 'Moderate' },
    { setId: 3, reps: 12, contractDuration: 5, restDuration: 1, intensity: 'Moderate' },
    { setId: 4, reps: 10, contractDuration: 3, restDuration: 1, intensity: 'High' },
];
const setRestDuration = 30; // 30 seconds rest between sets

// Global state variables
let currentSetIndex = 0;
let currentRep = 0;
let timer = 0;
let phase = 'idle'; // 'idle', 'contract', 'rep_rest', 'set_rest', 'finished'
let isRunning = false;
let isSoundOn = true;

// Refs for timer interval and audio context
let timerInterval = null;
let audioContext = null;
let oscillator = null;
let gainNode = null;

// DOM elements references (will be initialized after DOM is loaded)
let appRoot;
let timerDisplayElement;
let actionTextElement;
let setRepDisplayElement;
let startPauseButton;
let resetButton;
let skipSetButton;
let soundToggleButton;
let soundToggleText;
let exercisePlanList;

/**
 * Initializes the Web Audio API context and nodes.
 * This should be called on user interaction to avoid browser autoplay policies.
 */
const initializeAudio = () => {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Start silent
        } catch (e) {
            console.error("Web Audio API is not supported in this browser or failed to initialize:", e);
            isSoundOn = false; // Disable sound if not supported
            updateSoundToggleUI(); // Update UI to reflect sound being off
        }
    }
};

/**
 * Plays a beep sound with a given frequency and duration.
 * @param {number} frequency - The frequency of the beep in Hz.
 * @param {number} duration - The duration of the beep in seconds.
 */
const playBeep = (frequency, duration) => {
    if (!isSoundOn || !audioContext || !gainNode) return;

    // Stop any existing oscillator
    if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
    }

    try {
        oscillator = audioContext.createOscillator();
        oscillator.type = 'sine'; // Sine wave for a clear beep
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.connect(gainNode);

        // Fade in and out for a softer sound
        gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01); // Quick fade in
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration - 0.01); // Fade out

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.error("Error playing beep:", error);
    }
};

/**
 * Determines the next phase of the exercise and updates the state.
 */
const nextPhase = () => {
    const currentSet = exercisePlan[currentSetIndex];

    if (!currentSet && phase !== 'finished') { // Ensure we don't re-enter finished state
        // All sets completed
        phase = 'finished';
        isRunning = false;
        clearInterval(timerInterval);
        timerInterval = null;
        playBeep(600, 0.5); // End of exercise beep
        updateUI();
        return;
    }

    if (phase === 'contract') {
        // Move from contract to rep_rest
        phase = 'rep_rest';
        timer = currentSet.restDuration;
        playBeep(400, 0.2); // Beep for rest
    } else if (phase === 'rep_rest') {
        // Move from rep_rest to next contract or set_rest
        const nextRep = currentRep + 1;
        if (nextRep < currentSet.reps) {
            // Next repetition in the same set
            currentRep = nextRep;
            phase = 'contract';
            timer = currentSet.contractDuration;
            playBeep(800, 0.2); // Beep for contract
        } else {
            // End of current set, move to set_rest or next set
            currentRep = 0; // Reset rep for next set
            if (currentSetIndex < exercisePlan.length - 1) {
                // Move to set rest
                phase = 'set_rest';
                timer = setRestDuration;
                playBeep(600, 0.5); // Beep for set rest
            } else {
                // All sets finished
                phase = 'finished';
                isRunning = false;
                clearInterval(timerInterval);
                timerInterval = null;
                playBeep(600, 0.5); // End of exercise beep
            }
        }
    } else if (phase === 'set_rest') {
        // Move from set_rest to next set's contract phase
        currentSetIndex++;
        currentRep = 0; // Reset rep for new set
        phase = 'contract';
        timer = exercisePlan[currentSetIndex].contractDuration;
        playBeep(800, 0.2); // Beep for contract
    } else if (phase === 'idle') {
        // Initial start: move to first contract phase
        phase = 'contract';
        timer = currentSet.contractDuration;
        playBeep(800, 0.2); // Beep for contract
    }
    updateUI(); // Update UI after phase change
};

/**
 * Starts or pauses the timer.
 */
const handleStartPause = async () => {
    initializeAudio(); // Ensure audio context is initialized and resumed on user interaction

    if (audioContext && audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch (e) {
            console.error("Error resuming AudioContext:", e);
        }
    }

    if (phase === 'finished') {
        handleRestart();
    } else {
        isRunning = !isRunning;
        if (isRunning && phase === 'idle') {
            nextPhase(); // Start the first phase if idle
        }
        updateTimerInterval();
        updateUI();
    }
};

/**
 * Resets the exercise to the beginning.
 */
const handleRestart = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    currentSetIndex = 0;
    currentRep = 0;
    timer = 0;
    phase = 'idle';
    isRunning = false;
    updateUI();
};

/**
 * Skips the current set and moves to the next set's rest period.
 */
const handleSkipSet = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    const nextSetIdx = currentSetIndex + 1;
    if (nextSetIdx < exercisePlan.length) {
        currentSetIndex = nextSetIdx;
        currentRep = 0;
        phase = 'set_rest'; // Go to set rest before the next set
        timer = setRestDuration;
        isRunning = true; // Automatically start the set rest
        playBeep(600, 0.5); // Beep for skipping to set rest
        updateTimerInterval();
    } else {
        // If no more sets, finish the exercise
        phase = 'finished';
        isRunning = false;
        playBeep(600, 0.5); // End of exercise beep
    }
    updateUI();
};

/**
 * Updates the setInterval based on isRunning state.
 */
const updateTimerInterval = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (isRunning && timer > 0) {
        timerInterval = setInterval(() => {
            timer--;
            if (timer === 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                nextPhase();
            }
            updateUI(); // Update UI every second
        }, 1000);
    } else if (isRunning && timer === 0 && phase !== 'finished') {
        // If timer is 0 but still running, move to next phase immediately
        nextPhase();
    }
};

/**
 * Updates the sound toggle UI element.
 */
const updateSoundToggleUI = () => {
    if (soundToggleButton) {
        soundToggleButton.checked = isSoundOn;
    }
    if (soundToggleText) {
        soundToggleText.textContent = isSoundOn ? 'On' : 'Off';
    }
};

/**
 * Renders or updates the entire UI based on the current state.
 */
const updateUI = () => {
    const currentSet = exercisePlan[currentSetIndex];
    const totalSets = exercisePlan.length;

    // Update Timer Display
    if (timerDisplayElement) {
        timerDisplayElement.textContent = timer.toString().padStart(2, '0');
        // Update border and text color based on phase
        const timerClasses = ['text-gray-600', 'border-gray-400', 'text-green-600', 'border-green-400',
                              'text-blue-600', 'border-blue-400', 'text-purple-600', 'border-purple-400',
                              'text-indigo-600', 'border-indigo-400'];
        timerDisplayElement.parentElement.classList.remove(...timerClasses); // Remove previous colors
        timerDisplayElement.classList.remove(...timerClasses);

        let timerDisplayColor = '';
        let timerBorderColor = '';

        if (phase === 'idle') {
            actionTextElement.textContent = 'Ready to begin?';
            timerDisplayColor = 'text-gray-600';
            timerBorderColor = 'border-gray-400';
        } else if (phase === 'contract') {
            actionTextElement.textContent = currentSet ? `Contract! (${currentSet.intensity} Intensity)` : 'Contracting...';
            timerDisplayColor = 'text-green-600';
            timerBorderColor = 'border-green-400';
        } else if (phase === 'rep_rest') {
            actionTextElement.textContent = 'Rest!';
            timerDisplayColor = 'text-blue-600';
            timerBorderColor = 'border-blue-400';
        } else if (phase === 'set_rest') {
            actionTextElement.textContent = 'Set Rest!';
            timerDisplayColor = 'text-purple-600';
            timerBorderColor = 'border-purple-400';
        } else if (phase === 'finished') {
            actionTextElement.textContent = 'Exercise Complete!';
            timerDisplayColor = 'text-indigo-600';
            timerBorderColor = 'border-indigo-400';
        }

        timerDisplayElement.classList.add(timerDisplayColor);
        timerDisplayElement.parentElement.classList.add(timerBorderColor);
    }

    // Update Set and Rep Information
    if (setRepDisplayElement) {
        setRepDisplayElement.textContent = currentSet
            ? `Set ${currentSetIndex + 1}/${totalSets} | Rep ${currentRep + 1}/${currentSet.reps}`
            : '';
    }

    // Update Control Buttons
    if (startPauseButton) {
        startPauseButton.textContent = phase === 'finished' ? 'Restart' : (isRunning ? 'Pause' : 'Start');
    }
    if (skipSetButton) {
        skipSetButton.disabled = (currentSetIndex === exercisePlan.length - 1 && phase !== 'set_rest' && phase !== 'finished');
    }

    // Update Sound Toggle UI
    updateSoundToggleUI();

    // Update Exercise Plan List (highlight current set)
    if (exercisePlanList) {
        Array.from(exercisePlanList.children).forEach((li, index) => {
            li.classList.remove('bg-indigo-100', 'border-l-4', 'border-indigo-500');
            li.classList.add('bg-gray-50');
            if (index === currentSetIndex && phase !== 'finished') {
                li.classList.add('bg-indigo-100', 'border-l-4', 'border-indigo-500');
                li.classList.remove('bg-gray-50');
            }
        });
    }
};

/**
 * Dynamically creates and appends the main application UI elements to the DOM.
 */
const createUI = () => {
    appRoot = document.getElementById('app-root');
    if (!appRoot) {
        console.error("App root element not found!");
        return;
    }
    appRoot.innerHTML = ''; // Clear existing content

    // App Title
    const title = document.createElement('h1');
    title.className = "text-4xl font-extrabold text-indigo-800 mb-8 drop-shadow-lg";
    title.textContent = "Kegel Timer";
    appRoot.appendChild(title);

    // Main Timer Display
    const timerContainer = document.createElement('div');
    timerContainer.className = `relative w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center bg-white shadow-xl transition-all duration-500 ease-in-out border-8`;
    timerDisplayElement = document.createElement('div');
    timerDisplayElement.className = `text-7xl md:text-8xl font-bold transition-colors duration-500`;
    timerContainer.appendChild(timerDisplayElement);
    actionTextElement = document.createElement('div');
    actionTextElement.className = "absolute bottom-8 text-xl font-semibold text-gray-700";
    timerContainer.appendChild(actionTextElement);
    appRoot.appendChild(timerContainer);

    // Set and Rep Information
    setRepDisplayElement = document.createElement('div');
    setRepDisplayElement.className = "mt-8 text-2xl font-semibold text-gray-700";
    appRoot.appendChild(setRepDisplayElement);

    // Control Buttons
    const controlsContainer = document.createElement('div');
    controlsContainer.className = "flex flex-wrap justify-center gap-4 mt-12 w-full max-w-md";

    startPauseButton = document.createElement('button');
    startPauseButton.className = "flex-1 min-w-[120px] px-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105";
    startPauseButton.addEventListener('click', handleStartPause);
    controlsContainer.appendChild(startPauseButton);

    resetButton = document.createElement('button');
    resetButton.className = "flex-1 min-w-[120px] px-6 py-3 bg-purple-600 text-white text-lg font-semibold rounded-full shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105";
    resetButton.textContent = "Reset";
    resetButton.addEventListener('click', handleRestart);
    controlsContainer.appendChild(resetButton);

    skipSetButton = document.createElement('button');
    skipSetButton.className = "flex-1 min-w-[120px] px-6 py-3 bg-teal-600 text-white text-lg font-semibold rounded-full shadow-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105";
    skipSetButton.textContent = "Skip Set";
    skipSetButton.addEventListener('click', handleSkipSet);
    controlsContainer.appendChild(skipSetButton);

    appRoot.appendChild(controlsContainer);

    // Sound Toggle
    const soundToggleContainer = document.createElement('div');
    soundToggleContainer.className = "mt-8 flex items-center space-x-3";
    const soundLabel = document.createElement('span');
    soundLabel.className = "text-lg font-medium text-gray-700";
    soundLabel.textContent = "Sound:";
    soundToggleContainer.appendChild(soundLabel);

    const toggleLabel = document.createElement('label');
    toggleLabel.htmlFor = "soundToggle";
    toggleLabel.className = "relative inline-flex items-center cursor-pointer";
    soundToggleButton = document.createElement('input');
    soundToggleButton.type = "checkbox";
    soundToggleButton.id = "soundToggle";
    soundToggleButton.className = "sr-only peer";
    soundToggleButton.checked = isSoundOn;
    soundToggleButton.addEventListener('change', () => {
        isSoundOn = !isSoundOn;
        updateSoundToggleUI();
        initializeAudio(); // Initialize audio context on toggle if not already
    });
    toggleLabel.appendChild(soundToggleButton);

    const toggleDiv = document.createElement('div');
    toggleDiv.className = "w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600";
    toggleLabel.appendChild(toggleDiv);

    soundToggleText = document.createElement('span');
    soundToggleText.className = "ml-3 text-sm font-medium text-gray-900";
    toggleLabel.appendChild(soundToggleText);

    soundToggleContainer.appendChild(toggleLabel);
    appRoot.appendChild(soundToggleContainer);

    // Exercise Details Section
    const exerciseDetailsContainer = document.createElement('div');
    exerciseDetailsContainer.className = "mt-12 w-full max-w-lg bg-white rounded-xl shadow-lg p-6";
    const exerciseTitle = document.createElement('h2');
    exerciseTitle.className = "text-2xl font-bold text-indigo-700 mb-4 text-center";
    exerciseTitle.textContent = "Exercise Plan";
    exerciseDetailsContainer.appendChild(exerciseTitle);

    exercisePlanList = document.createElement('ul');
    exercisePlanList.className = "space-y-3";
    exercisePlan.forEach((set, index) => {
        const listItem = document.createElement('li');
        listItem.className = `p-4 rounded-lg flex items-center justify-between ${index === currentSetIndex && phase !== 'finished' ? 'bg-indigo-100 border-l-4 border-indigo-500' : 'bg-gray-50'}`;
        const divContent = document.createElement('div');
        const pReps = document.createElement('p');
        pReps.className = "text-lg font-semibold text-gray-800";
        pReps.textContent = `Set ${set.setId}: ${set.reps} Reps`;
        const pDuration = document.createElement('p');
        pDuration.className = "text-sm text-gray-600";
        pDuration.textContent = `${set.contractDuration}s ${set.intensity} Contraction, ${set.restDuration}s Rest`;
        divContent.appendChild(pReps);
        divContent.appendChild(pDuration);
        listItem.appendChild(divContent);

        if (index < exercisePlan.length - 1) {
            const spanRest = document.createElement('span');
            spanRest.className = "text-sm text-gray-500";
            spanRest.textContent = `(30s Rest After)`;
            listItem.appendChild(spanRest);
        }
        exercisePlanList.appendChild(listItem);
    });
    exerciseDetailsContainer.appendChild(exercisePlanList);
    appRoot.appendChild(exerciseDetailsContainer);

    // Initial UI update
    updateUI();
};

// Call createUI when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', createUI);
