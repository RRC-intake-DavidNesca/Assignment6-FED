/**
 * Initializes the Trivia Game when the DOM is fully loaded.
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
    // Cache a reference to the username input for auto-save/prefill behavior.
    const usernameInput = document.getElementById("username");
    // Cache a reference to the result summary box shown after submission.
    const resultSummary = document.getElementById("result-summary");
    // Cache a reference to the sort select control for the scoreboard (kept from Commit 8).
    const sortSelect = document.getElementById("sort-scores");
    // Cache a reference to the top score summary box (added in corrected Commit 9).
    const topScoreBox = document.getElementById("top-score");

    // On load, prefill the username from localStorage if it exists.
    checkUsername();
    // On load, apply the saved sort preference to the select control.
    applySavedSortPreference();
    // Fetch a fresh set of questions to display to the player.
    fetchQuestions();
    // Render any previously saved scores from localStorage at startup (sorted + highlighted).
    displayScores();

    // Listen for typing in the username field so we can persist it as the user types.
    usernameInput.addEventListener("input", function () {
        // Read the current value and trim whitespace.
        const value = (usernameInput.value || "").trim();
        // If a non-empty value exists, save it to localStorage; else remove it.
        if (value) {
            // Persist the current user’s name for convenience on reload.
            localStorage.setItem("triviaCurrentUser", value);
        } else {
            // Remove the saved value to avoid stale data.
            localStorage.removeItem("triviaCurrentUser");
        }
    });

    // Listen for changes to the sort select to update preference and re-render (kept from Commit 8).
    sortSelect.addEventListener("change", function () {
        // Store the newly selected sort mode under a dedicated key.
        localStorage.setItem("scoreSort", sortSelect.value);
        // Re-render the scoreboard using the updated sort preference.
        displayScores();
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
            // Ensure the loading skeleton is visible by removing the 'hidden' class.
            loadingEl.classList.remove("hidden"); // classList per module. :contentReference[oaicite:2]{index=2}
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

        // Select all question blocks currently displayed.
        const blocks = document.querySelectorAll("#question-container > div");
        // Track the first unanswered block for focus/scroll behavior.
        let firstUnanswered = null;
        // Loop through each question block by index to check selections.
        blocks.forEach((_, i) => {
            // Build a selector that targets the checked radio for this question.
            const sel = `input[name="answer${i}"]:checked`;
            // Find the checked input (if any) for the current question.
            const selected = document.querySelector(sel);
            // Get a reference to the block element for this index.
            const blockEl = blocks[i];
            // If no selection exists, mark invalid and record it.
            if (!selected) {
                // Add class to visually indicate an unanswered question.
                blockEl.classList.add("invalid");
                // If this is the first one we notice, remember it for focus/scroll.
                if (!firstUnanswered) firstUnanswered = blockEl;
            } else {
                // If answered, ensure any old invalid state is cleared.
                blockEl.classList.remove("invalid");
            }
        });

        // If any block was unanswered, guide the user and abort submission.
        if (firstUnanswered) {
            // Alert the user to complete all questions.
            alert("Please answer all questions before submitting.");
            // Focus the first radio inside that block to help the user proceed.
            const firstRadio = firstUnanswered.querySelector('input[type="radio"]');
            // If found, focus it.
            if (firstRadio) firstRadio.focus();
            // Scroll the block into view for visibility.
            firstUnanswered.scrollIntoView({ behavior: "smooth", block: "center" });
            // Abort submission until all are answered.
            return;
        }

        // Read the player name from the username input field and trim whitespace.
        const trimmed = (usernameInput.value || "").trim();
        // Enforce a non-empty name to attribute the score.
        if (!trimmed) {
            // Prompt the user to enter a name.
            alert("Please enter your name before finishing the game.");
            // Focus the field for convenience.
            usernameInput.focus();
            // Abort submission due to missing name.
            return;
        }

        // Count total questions for score display.
        const totalQuestions = blocks.length;
        // Count correct selections by matching checked inputs with data-correct="true".
        const correctSelections = document.querySelectorAll(
            'input[type="radio"][data-correct="true"]:checked'
        ).length;

        // Mark the correct and selected-incorrect answers for feedback.
        for (let i = 0; i < totalQuestions; i++) {
            // Find the correct input for this question by data attribute.
            const correctInput = document.querySelector(
                `input[name="answer${i}"][data-correct="true"]`
            );
            // If present, add a "correct" style to its label.
            if (correctInput && correctInput.parentElement) {
                correctInput.parentElement.classList.add("correct");
            }
            // Find the user’s selected input (if any) for this question.
            const selected = document.querySelector(`input[name="answer${i}"]:checked`);
            // If selected is wrong and has a label, mark it as incorrect.
            if (selected && selected !== correctInput && selected.parentElement) {
                selected.parentElement.classList.add("incorrect");
            }
        }

        // Build a readable summary string such as "Nice job, Name! You scored X/Y."
        const summaryText = `Nice job, ${trimmed}! You scored ${correctSelections}/${totalQuestions}.`;
        // Place the summary text into the result summary box.
        resultSummary.textContent = summaryText;
        // Ensure the result summary box is visible to the user.
        resultSummary.classList.remove("hidden");

        // Locate the tbody element to append a quick immediate row (visual continuity).
        const tbody = document.querySelector("#score-table tbody");
        // Create a new table row element for this player's result.
        const row = document.createElement("tr");
        // Create a cell for the player name.
        const nameCell = document.createElement("td");
        // Set the text content of the name cell to the player's name.
        nameCell.textContent = trimmed;
        // Create a cell for the player score.
        const scoreCell = document.createElement("td");
        // Set the text to "correct/total" so the user sees performance.
        scoreCell.textContent = `${correctSelections}/${totalQuestions}`;
        // Append name and score cells to the row.
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        // Append the completed row to the score table body.
        tbody.appendChild(row);

        // Persist the score to localStorage so it survives page reloads.
        saveScoreToStorage(trimmed, correctSelections, totalQuestions);
        // Re-render the scoreboard from storage so it reflects the saved list and current sort.
        displayScores();

        // Reveal the "New Player" button so another attempt can be made.
        newPlayerButton.classList.remove("hidden");
        // Disable the submit button to prevent duplicate submissions for the same attempt.
        document.getElementById("submit-game").disabled = true;
    }

    // Return the current sort preference from localStorage or a default.
    function getSortPreference() {
        // Read the stored preference (if any).
        const pref = localStorage.getItem("scoreSort");
        // Return stored value or the default of "newest".
        return pref || "newest";
    }

    // Apply the saved sort preference to the select control on load.
    function applySavedSortPreference() {
        // Read the preference value.
        const pref = getSortPreference();
        // Set the select’s value so the UI reflects the stored preference.
        sortSelect.value = pref;
    }

    // Safely read the stored scores array from localStorage.
    function getScoresFromStorage() {
        // Retrieve the JSON string for scores from localStorage.
        const raw = localStorage.getItem("scores");
        // If nothing is stored, return an empty array.
        if (!raw) return [];
        // Try to parse the stored JSON safely in case it was corrupted.
        try {
            // Convert the JSON text into a JavaScript array of score objects.
            return JSON.parse(raw);
        } catch (e) {
            // Log a warning so corruption is visible in the console.
            console.error("Invalid scores in storage:", e); // JSON per module. :contentReference[oaicite:3]{index=3}
            // Return an empty array to keep the app running.
            return [];
        }
    }

    // Write the provided scores array back to localStorage.
    function setScoresInStorage(scoresArray) {
        // Convert the array of score objects into a JSON string.
        const text = JSON.stringify(scoresArray); // stringify per module. :contentReference[oaicite:4]{index=4}
        // Save the JSON string into localStorage under the "scores" key.
        localStorage.setItem("scores", text);
    }

    // Append one new score object into persistent storage (with timestamp).
    function saveScoreToStorage(name, correct, total) {
        // Read the current list from storage (or an empty array).
        const scores = getScoresFromStorage();
        // Create a new score record object with a timestamp used for sorting.
        const record = { name: name, correct: correct, total: total, ts: Date.now() };
        // Append the new record to the in-memory array.
        scores.push(record);
        // Write the updated array back to storage.
        setScoresInStorage(scores);
    }

    // Render the scoreboard entirely from localStorage, applying the current sort preference + top highlight.
    function displayScores() {
        // Select the table body where rows will be displayed.
        const tbody = document.querySelector("#score-table tbody");
        // Clear any existing rows to avoid duplicates.
        tbody.innerHTML = "";
        // Read the array of saved scores from storage.
        const scores = getScoresFromStorage();
        // Read the sort preference to decide how to order the rows.
        const pref = getSortPreference();

        // Sort the scores array based on the selected preference.
        if (pref === "newest") {
            // Sort by descending timestamp (most recent first).
            scores.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        } else if (pref === "oldest") {
            // Sort by ascending timestamp (oldest first).
            scores.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        } else if (pref === "highest") {
            // Sort by descending score ratio, then by most recent for ties.
            scores.sort((a, b) => {
                // Compute ratios safely to avoid division by zero.
                const ra = a.total ? a.correct / a.total : 0;
                const rb = b.total ? b.correct / b.total : 0;
                // Compare ratios primarily.
                if (rb !== ra) return rb - ra;
                // Tie-break by timestamp (newest first).
                return (b.ts || 0) - (a.ts || 0);
            });
        } else if (pref === "lowest") {
            // Sort by ascending score ratio, then by oldest for ties.
            scores.sort((a, b) => {
                const ra = a.total ? a.correct / a.total : 0;
                const rb = b.total ? b.correct / b.total : 0;
                if (ra !== rb) return ra - rb;
                // Tie-break by timestamp (oldest first).
                return (a.ts || 0) - (b.ts || 0);
            });
        }

        // Compute the top percentage (rounded to integer) to support highlighting.
        let topPercent = null;
        // If any scores exist, determine the best percentage among them.
        if (scores.length > 0) {
            // Pick the first item’s ratio after sorting by the chosen preference is not correct;
            // instead compute the absolute best ratio across all scores to fairly highlight “top”.
            topPercent = scores.reduce((best, s) => {
                // Compute this score’s integer percent safely.
                const pct = Math.round((s.total ? (s.correct / s.total) : 0) * 100);
                // Return the higher of the two values.
                return pct > best ? pct : best;
            }, 0);
        }

        // Track how many rows share the top percent (for the summary box).
        let topCount = 0;

        // Loop through each saved score and render a table row.
        scores.forEach(function (s) {
            // Create a table row element for this saved record.
            const tr = document.createElement("tr");
            // Compute this record’s integer percent for highlighting.
            const pct = Math.round(((s.total ? s.correct / s.total : 0) * 100));
            // If this record matches the top percentage, mark it and bump the count.
            if (topPercent !== null && pct === topPercent) {
                // Add a CSS class used to tint the entire row.
                tr.classList.add("top");
                // Increment the number of top-scoring rows.
                topCount++;
            }
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

        // Update or hide the Top score summary box based on data presence.
        if (scores.length === 0) {
            // If no scores, clear text and hide the box.
            topScoreBox.textContent = "";
            // Add hidden class so it doesn’t show.
            topScoreBox.classList.add("hidden");
        } else {
            // Build a summary message with percent and tie count.
            const label = topCount === 1 ? "player" : "players";
            // Compose “Top score: XX% (N players)” summary.
            const summary = "🏆 Top score: " + topPercent + "% (" + topCount + " " + label + ")";
            // Put text into the summary box.
            topScoreBox.textContent = summary;
            // Ensure the summary box is visible.
            topScoreBox.classList.remove("hidden");
        }
    }

    // Prefill the username from localStorage if available.
    function checkUsername() {
        // Read any saved name for the current user from localStorage.
        const stored = localStorage.getItem("triviaCurrentUser");
        // If a stored value exists, place it into the input field.
        if (stored) {
            // Prefill the username input with the stored value.
            usernameInput.value = stored;
        }
    }

    // Begin a new player session by resetting UI state and fetching fresh questions.
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
        // Scroll to the top for a clean start.
        window.scrollTo(0, 0);
    }

    // Implement the Clear Scores behavior (kept from earlier commit).
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
