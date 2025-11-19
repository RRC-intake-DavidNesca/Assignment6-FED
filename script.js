/**
 * Initializes the Trivia Game when the DOM is fully loaded.
 * Commit 4: saved scores to localStorage and rendered scoreboard on load.
 * Commit 5: added Clear Scores button/logic.
 * Commit 6: auto-saves/prefills username and requires all questions answered before submit.
 */

// Attach a listener so code runs after the initial HTML has been parsed.
document.addEventListener("DOMContentLoaded", function () {
    // Cache a reference to the trivia form for submission handling.
    const form = document.getElementById("trivia-form");
    // Cache the container where questions will be injected dynamically.
    const questionContainer = document.getElementById("question-container");
    // Cache a reference to the "New Player" button for starting a fresh round.
    const newPlayerButton = document.getElementById("new-player");
    // Cache a reference to the "Clear Scores" button for wiping stored scores.
    const clearScoresButton = document.getElementById("clear-scores");
    // Cache a reference to the username input for auto-save/prefill behavior (Commit 6).
    const usernameInput = document.getElementById("username");

    // On load, prefill the username from localStorage if it exists (Commit 6).
    checkUsername();
    // Trigger a fetch to load trivia questions from the API.
    fetchQuestions();
    // Populate the scores table from localStorage at startup.
    displayScores();

    // Listen for typing in the username field so we can persist it as the user types (Commit 6).
    usernameInput.addEventListener("input", function () {
        // Read the current value and trim whitespace
        const value = (usernameInput.value || "").trim();
        // If a non-empty value exists, save it to localStorage
        if (value) {
            // Persist the current user’s name for convenience on reload
            localStorage.setItem("triviaCurrentUser", value);
        } else {
            // If the field is empty, remove the saved value to avoid stale data
            localStorage.removeItem("triviaCurrentUser");
        }
    });

    // Define a function that retrieves trivia questions from the API and displays them.
    /**
     * Fetches trivia questions from the API and displays them.
     */
    function fetchQuestions() {
        // Show the loading state while the API request is in progress.
        showLoading(true); // Show loading state

        // Use the Fetch API to request 10 multiple-choice questions.
        fetch("https://opentdb.com/api.php?amount=10&type=multiple")
            // Convert the network response into JSON so we can access the results array.
            .then((response) => response.json())
            // Handle the parsed JSON data and display the questions.
            .then((data) => {
                // Render the returned questions into the question container.
                displayQuestions(data.results);
                // Hide the loading state because data is ready.
                showLoading(false); // Hide loading state
            })
            // Catch any error from the network request or JSON parsing.
            .catch((error) => {
                // Log the error so it is easier to debug.
                console.error("Error fetching questions:", error);
                // Hide the loading state if an error occurs.
                showLoading(false); // Hide loading state on error
            });
    }

    // Define a function that toggles the visibility of the loader and question container.
    /**
     * Toggles the display of the loading state and question container.
     *
     * @param {boolean} isLoading - Indicates whether the loading state should be shown.
     */
    function showLoading(isLoading) {
        // Get a reference to the loading container element.
        const loadingEl = document.getElementById("loading-container");
        // Get a reference to the question container element.
        const questionsEl = document.getElementById("question-container");
        // If we are currently loading, show the skeleton and hide the questions.
        if (isLoading) {
            // Ensure the loading skeleton is visible by removing the 'hidden' class (per modules: classList). :contentReference[oaicite:1]{index=1}
            loadingEl.classList.remove("hidden");
            // Ensure the questions are hidden during loading by adding the 'hidden' class.
            questionsEl.classList.add("hidden");
        } else {
            // Hide the loading skeleton by adding the 'hidden' class.
            loadingEl.classList.add("hidden");
            // Reveal the questions by removing the 'hidden' class.
            questionsEl.classList.remove("hidden");
        }
    }

    // Define a function that displays fetched trivia questions into the DOM.
    /**
     * Displays fetched trivia questions.
     * @param {Object[]} questions - Array of trivia questions.
     */
    function displayQuestions(questions) {
        // Clear any previously rendered questions so we start fresh.
        questionContainer.innerHTML = ""; // Clear existing questions
        // Loop over the array of question objects and render each one.
        questions.forEach((question, index) => {
            // Create a container for the current question block.
            const questionDiv = document.createElement("div");
            // Build the inner HTML for the question text and its answer options.
            questionDiv.innerHTML = `
                <p>${question.question}</p>
                ${createAnswerOptions(
                    question.correct_answer,
                    question.incorrect_answers,
                    index
                )}
            `;
            // Append the question block to the main question container in the form.
            questionContainer.appendChild(questionDiv);
        });
    }

    // Define a helper that produces the markup for multiple-choice answers.
    /**
     * Creates HTML for answer options.
     * @param {string} correctAnswer - The correct answer for the question.
     * @param {string[]} incorrectAnswers - Array of incorrect answers.
     * @param {number} questionIndex - The index of the current question.
     * @returns {string} HTML string of answer options.
     */
    function createAnswerOptions(
        correctAnswer,
        incorrectAnswers,
        questionIndex
    ) {
        // Combine the correct answer and incorrect answers into one array and shuffle them.
        const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
            () => Math.random() - 0.5
        );
        // Return a string of label+radio inputs, marking the correct answer with a data attribute.
        return allAnswers
            .map(
                (answer) => `
            <label>
                <input type="radio" name="answer${questionIndex}" value="${answer}" ${
                    answer === correctAnswer ? 'data-correct="true"' : ""
                }>
                ${answer}
            </label>
        `
            )
            // Join the array of option strings into one HTML string.
            .join("");
    }

    // Attach an event listener that will handle the form submission (finish game).
    form.addEventListener("submit", handleFormSubmit);
    // Attach an event listener that will start a new player session when clicked.
    newPlayerButton.addEventListener("click", newPlayer);
    // Attach an event listener that clears saved scores when clicked.
    clearScoresButton.addEventListener("click", clearScores);

    // Define the handler that runs when the player submits the form.
    /**
     * Handles the trivia form submission.
     * @param {Event} event - The submit event.
     */
    function handleFormSubmit(event) {
        // Prevent the browser from performing its default form submission (page reload).
        event.preventDefault();

        // Compute how many question blocks are currently rendered.
        const totalQuestions = document.querySelectorAll(
            "#question-container > div"
        ).length;
        // Start counters for correct answers and unanswered questions (Commit 6).
        let score = 0;
        // Track unanswered so we can enforce completion before scoring
        let unanswered = 0;

        // Loop through each question index to find the selected answer.
        for (let i = 0; i < totalQuestions; i++) {
            // Build a selector that targets the checked radio for this question.
            const selector = `input[name="answer${i}"]:checked`;
            // Find the checked input (if any) for the current question.
            const selected = document.querySelector(selector);
            // If an option is selected and it carries the correct-answer data attribute, increase the score.
            if (selected && selected.dataset && selected.dataset.correct === "true") {
                // Increment the score for a correct selection.
                score++;
            // If there is no selection, increment unanswered count (Commit 6).
            } else if (!selected) {
                // Increase the count of unanswered questions.
                unanswered++;
            }
        }

        // If any questions are unanswered, alert and abort (Commit 6).
        if (unanswered > 0) {
            // Show a simple message so the user knows to finish all items first.
            alert("Please answer all questions before submitting the game.");
            // Stop here—do not write to the table or to storage yet.
            return;
        }

        // Read the player name from the username input field.
        const nameInput = document.getElementById("username");
        // Use the trimmed value or a default of "Anonymous" if nothing was entered.
        const playerName = (nameInput.value || "").trim() || "Anonymous";

        // Locate the tbody element where we will insert a new score row immediately (visual continuity).
        const tbody = document.querySelector("#score-table tbody");
        // Create a new table row element for this player's result.
        const row = document.createElement("tr");
        // Create a cell for the player name.
        const nameCell = document.createElement("td");
        // Set the text content of the name cell to the player's name.
        nameCell.textContent = playerName;
        // Create a cell for the player score.
        const scoreCell = document.createElement("td");
        // Set the text to "correct/total" so the user sees performance.
        scoreCell.textContent = `${score}/${totalQuestions}`;
        // Append the name cell to the new table row.
        row.appendChild(nameCell);
        // Append the score cell to the new table row.
        row.appendChild(scoreCell);
        // Append the completed row to the score table body.
        tbody.appendChild(row);

        // Persist the score to localStorage so it survives page reloads (Module 6 topic).
        saveScoreToStorage(playerName, score, totalQuestions); // uses JSON.stringify/parse per notes. :contentReference[oaicite:2]{index=2}
        // Persist the player name so it pre-fills next time (Commit 6).
        localStorage.setItem("triviaCurrentUser", playerName);
        // Re-render the scoreboard from storage so it reflects the full persisted list.
        displayScores();

        // Reveal the "New Player" button so another attempt can be made.
        newPlayerButton.classList.remove("hidden");
        // Disable the submit button to prevent duplicate submissions for the same attempt.
        document.getElementById("submit-game").disabled = true;
    }

    // Add a helper that safely reads the stored scores array from localStorage.
    function getScoresFromStorage() {
        // Retrieve the JSON string for scores from localStorage.
        const raw = localStorage.getItem("scores");
        // If nothing is stored, return an empty array.
        if (!raw) {
            // Return an empty list because there are no scores yet.
            return [];
        }
        // Try to parse the stored JSON safely in case it was corrupted.
        try {
            // Convert the JSON text into a JavaScript array of score objects.
            return JSON.parse(raw);
        } catch (e) {
            // Log a warning so corruption is visible in the console (per Debugging notes).
            console.error("Invalid scores in storage:", e); // :contentReference[oaicite:3]{index=3}
            // Return an empty array to keep the app running.
            return [];
        }
    }

    // Add a helper that writes the provided scores array back to localStorage.
    function setScoresInStorage(scoresArray) {
        // Convert the array of score objects into a JSON string.
        const text = JSON.stringify(scoresArray); // :contentReference[oaicite:4]{index=4}
        // Save the JSON string into localStorage under the "scores" key.
        localStorage.setItem("scores", text);
    }

    // Add a helper that appends one new score object into persistent storage.
    function saveScoreToStorage(name, correct, total) {
        // Read the current list from storage (or an empty array).
        const scores = getScoresFromStorage();
        // Create a new score record object with the player name and result.
        const record = { name: name, correct: correct, total: total, ts: Date.now() };
        // Append the new record to the in-memory array.
        scores.push(record);
        // Write the updated array back to storage.
        setScoresInStorage(scores);
    }

    // Implement a renderer that draws the scoreboard entirely from localStorage.
    function displayScores() {
        // Select the table body where rows will be displayed.
        const tbody = document.querySelector("#score-table tbody");
        // Clear any existing rows to avoid duplicates.
        tbody.innerHTML = "";
        // Read the array of saved scores from storage.
        const scores = getScoresFromStorage();
        // Loop through each saved score and render a table row.
        scores.forEach(function (s) {
            // Create a table row element for this saved record.
            const tr = document.createElement("tr");
            // Create a cell for the player's name.
            const tdName = document.createElement("td");
            // Put the player's name into the first cell.
            tdName.textContent = s.name;
            // Create a cell for the formatted score.
            const tdScore = document.createElement("td");
            // Set the score text as "correct/total".
            tdScore.textContent = s.correct + "/" + s.total;
            // Append the name cell to the row.
            tr.appendChild(tdName);
            // Append the score cell to the row.
            tr.appendChild(tdScore);
            // Append the completed row to the tbody.
            tbody.appendChild(tr);
        });
    }

    // Prefill the username from localStorage if available (Commit 6).
    function checkUsername() {
        // Read any saved name for the current user from localStorage.
        const stored = localStorage.getItem("triviaCurrentUser");
        // If a stored value exists, place it into the input field.
        if (stored) {
            // Prefill the username input with the stored value.
            usernameInput.value = stored;
        }
    }

    // Keep the New Player flow and clear the saved "current user" (Commit 6 adds removal).
    /**
     * Begins a new player session by resetting UI state and fetching fresh questions.
     */
    function newPlayer() {
        // Clear any previously entered name from the input.
        usernameInput.value = "";
        // Remove the saved current user so the field is blank next time.
        localStorage.removeItem("triviaCurrentUser");
        // Re-enable the submit button so the next submission is allowed.
        document.getElementById("submit-game").disabled = false;
        // Hide the New Player button again until after the next submission.
        newPlayerButton.classList.add("hidden");
        // Clear the existing questions so the next set won’t stack with the old ones.
        questionContainer.innerHTML = "";
        // Show the loader while fetching new questions.
        showLoading(true);
        // Fetch a fresh set of questions to start a new round.
        fetchQuestions();
        // Put keyboard focus back into the name field for convenience.
        usernameInput.focus();
    }

    // Implement the Clear Scores behavior (kept from Commit 5).
    function clearScores() {
        // Ask the user for confirmation using the built-in confirm dialog.
        const ok = window.confirm("Clear all saved scores? This cannot be undone.");
        // If the user confirmed the action, proceed to wipe the scores.
        if (ok) {
            // Remove the 'scores' entry from localStorage to clear all saved attempts.
            localStorage.removeItem("scores");
            // Re-render the scoreboard so it immediately reflects the cleared state.
            displayScores();
        }
    }
});
// End of DOMContentLoaded handler.
