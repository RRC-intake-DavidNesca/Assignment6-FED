/**
 * Initializes the Trivia Game 
 */

// Explain that we wait until the DOM is ready so element lookups will work.
document.addEventListener("DOMContentLoaded", function () {
    // Cache a reference to the trivia form element for submit handling.
    const form = document.getElementById("trivia-form");
    // Cache the container that will hold the rendered questions.
    const questionContainer = document.getElementById("question-container");
    // Cache the New Player button used to start a fresh round.
    const newPlayerButton = document.getElementById("new-player");
    // Cache the Clear Scores button used to wipe stored scores.
    const clearScoresButton = document.getElementById("clear-scores");
    // Cache the username input so we can prefill and validate.
    const usernameInput = document.getElementById("username");
    // Cache the result summary box that shows after submission.
    const resultSummary = document.getElementById("result-summary");
    // Cache the scoreboard sort <select> from Commit 8.
    const sortSelect = document.getElementById("sort-scores");
    // Cache the filter input (Commit 10).
    const filterInput = document.getElementById("filter-player");
    // Cache the Top Score summary box from Commit 9.
    const topScoreBox = document.getElementById("top-score");
    // Cache the Average summary box (Commit 10).
    const avgScoreBox = document.getElementById("avg-score");

    // Prefill the username field from localStorage if a value is saved.
    checkUsername();
    // Apply the saved scoreboard sort preference to the select control.
    applySavedSortPreference();
    // Apply the saved player-name filter to the filter input (Commit 10).
    applySavedFilter();
    // Fetch questions from the API and render them with a loading state.
    fetchQuestions();
    // Render any saved scores immediately (will also highlight top score and compute average).
    displayScores();

    // Listen for typing in the username box so we can persist the value as the user types.
    usernameInput.addEventListener("input", function () {
        // Read and trim the current value to avoid saving stray spaces.
        const value = (usernameInput.value || "").trim();
        // If the field is non-empty, save it to localStorage.
        if (value) {
            // Save the name so it can be restored on reload.
            localStorage.setItem("triviaCurrentUser", value);
        // Otherwise, remove the key so we don’t keep an empty string around.
        } else {
            // Remove the stored name if the field was cleared.
            localStorage.removeItem("triviaCurrentUser");
        }
    });

    // When the sort <select> changes, save the preference and re-render the table.
    sortSelect.addEventListener("change", function () {
        // Save the chosen sort option to localStorage.
        localStorage.setItem("scoreSort", sortSelect.value);
        // Repaint the scoreboard to reflect the new order.
        displayScores();
    });

    // When the filter text changes, persist it and re-render (Commit 10).
    filterInput.addEventListener("input", function () {
        // Save the current filter string to localStorage.
        localStorage.setItem("scoreFilter", filterInput.value);
        // Repaint the scoreboard using the current filter.
        displayScores();
    });

    // Document what the fetchQuestions function does in this block comment.
    /**
     * Fetches trivia questions from the API and displays them.
     */
    // Define the function that loads questions and manages the loader.
    function fetchQuestions() {
        // Show the skeleton loader and hide questions during network fetch.
        showLoading(true);

        // Request 10 multiple-choice questions from Open Trivia DB.
        fetch("https://opentdb.com/api.php?amount=10&type=multiple")
            // Parse the network response as JSON so we can read `results`.
            .then((response) => response.json())
            // Handle the parsed data and render the question blocks.
            .then((data) => {
                // Render the questions into the #question-container.
                displayQuestions(data.results);
                // Hide the loader now that content is ready.
                showLoading(false);
            })
            // Catch any errors (network or parsing) and fail gracefully.
            .catch((error) => {
                // Log the error for debugging in the console.
                console.error("Error fetching questions:", error);
                // Hide the loader even when an error occurs.
                showLoading(false);
            });
    }

    // Document what showLoading does in this block comment.
    /**
     * Toggles the display of the loading state and question container.
     *
     * @param {boolean} isLoading - Indicates whether the loading state should be shown.
     */
    // Define the helper that flips visibility of loader vs. questions.
    function showLoading(isLoading) {
        // Grab the loader container element by ID.
        const loadingEl = document.getElementById("loading-container");
        // Grab the questions container element by ID.
        const questionsEl = document.getElementById("question-container");
        // If we are loading, show the loader and hide the questions.
        if (isLoading) {
            // Remove the 'hidden' class from the loader to show it.
            loadingEl.classList.remove("hidden");
            // Add the 'hidden' class to the questions to hide them.
            questionsEl.classList.add("hidden");
        // Otherwise we are done loading, so invert visibility.
        } else {
            // Add the 'hidden' class to the loader to hide it.
            loadingEl.classList.add("hidden");
            // Remove the 'hidden' class from the questions to show them.
            questionsEl.classList.remove("hidden");
        }
    }

    // Document what displayQuestions does in this block comment.
    /**
     * Displays fetched trivia questions.
     * @param {Object[]} questions - Array of trivia questions.
     */
    // Define the function that renders question blocks into the DOM.
    function displayQuestions(questions) {
        // Clear any existing question blocks so we start fresh.
        questionContainer.innerHTML = "";
        // Loop over the array of question objects and render each one.
        questions.forEach((question, index) => {
            // Create a new container <div> for the question block.
            const questionDiv = document.createElement("div");
            // Set the inner HTML with the prompt and the randomized options.
            questionDiv.innerHTML = `
                <p>${question.question}</p>
                ${createAnswerOptions(
                    question.correct_answer,
                    question.incorrect_answers,
                    index
                )}
            `;
            // Append the fully built block into the #question-container.
            questionContainer.appendChild(questionDiv);
        });
    }

    // Document what createAnswerOptions does in this block comment.
    /**
     * Creates HTML for answer options.
     * @param {string} correctAnswer - The correct answer for the question.
     * @param {string[]} incorrectAnswers - Array of incorrect answers.
     * @param {number} questionIndex - The index of the current question.
     * @returns {string} HTML string of answer options.
     */
    // Define the helper that builds the list of radio options for a question.
    function createAnswerOptions(
        correctAnswer,
        incorrectAnswers,
        questionIndex
    ) {
        // Combine the correct answer with the incorrect ones and shuffle the array.
        const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
            () => Math.random() - 0.5
        );
        // Map each answer to a label+radio string (correct answer marked by data attribute) and join.
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
            // Concatenate the array of strings into a single HTML string.
            .join("");
    }

    // Hook the form submit event to our handler.
    form.addEventListener("submit", handleFormSubmit);
    // Hook the New Player button to the newPlayer function.
    newPlayerButton.addEventListener("click", newPlayer);
    // Hook the Clear Scores button to the clearScores function.
    clearScoresButton.addEventListener("click", clearScores);

    // Document what handleFormSubmit does in this block comment.
    /**
     * Handles the trivia form submission.
     * @param {Event} event - The submit event.
     */
    // Define the submit handler that validates, scores, persists, and updates UI.
    function handleFormSubmit(event) {
        // Prevent the browser’s default form submit (page reload).
        event.preventDefault();

        // Select all rendered question blocks so we can validate each one.
        const blocks = document.querySelectorAll("#question-container > div");
        // Track the first unanswered block to focus/scroll to it.
        let firstUnanswered = null;
        // Iterate each question by index to check if an answer is selected.
        blocks.forEach((_, i) => {
            // Build a selector for the checked radio in this question group.
            const sel = `input[name="answer${i}"]:checked`;
            // Find the selected radio input (if any) for this question.
            const selected = document.querySelector(sel);
            // Grab the question block element for styling feedback.
            const blockEl = blocks[i];
            // If nothing is selected, mark the block invalid and remember the first one.
            if (!selected) {
                // Add a CSS class that highlights unanswered content.
                blockEl.classList.add("invalid");
                // Record this as the first unanswered block if none recorded yet.
                if (!firstUnanswered) firstUnanswered = blockEl;
            // If an option is selected, ensure any old invalid state is removed.
            } else {
                // Remove the invalid class because this one is answered.
                blockEl.classList.remove("invalid");
            }
        });

        // If we found any unanswered question, guide the user and abort the submit.
        if (firstUnanswered) {
            // Notify the user that all questions must be answered.
            alert("Please answer all questions before submitting.");
            // Find the first radio in that block to focus it for convenience.
            const firstRadio = firstUnanswered.querySelector('input[type="radio"]');
            // If a radio exists, focus it to guide the user.
            if (firstRadio) firstRadio.focus();
            // Smoothly scroll the block into the center of the viewport.
            firstUnanswered.scrollIntoView({ behavior: "smooth", block: "center" });
            // Abort the submission so they can finish answering.
            return;
        }

        // Read and trim the player’s name from the input.
        const trimmed = (usernameInput.value || "").trim();
        // Enforce that a non-empty name is provided before scoring.
        if (!trimmed) {
            // Ask the user to enter their name first.
            alert("Please enter your name before finishing the game.");
            // Put focus back into the name field.
            usernameInput.focus();
            // Abort submission due to missing name.
            return;
        }

        // Determine how many questions were shown.
        const totalQuestions = blocks.length;
        // Count the number of correct checked answers across all questions.
        const correctSelections = document.querySelectorAll(
            'input[type="radio"][data-correct="true"]:checked'
        ).length;

        // Loop over each question again to add correct/incorrect styles to labels.
        for (let i = 0; i < totalQuestions; i++) {
            // Find the correct radio input for this question.
            const correctInput = document.querySelector(
                `input[name="answer${i}"][data-correct="true"]`
            );
            // If the correct input exists, mark its label with a "correct" class.
            if (correctInput && correctInput.parentElement) {
                // Add the positive styling class to the correct label.
                correctInput.parentElement.classList.add("correct");
            }
            // Find the selected radio (if any) for this question.
            const selected = document.querySelector(`input[name="answer${i}"]:checked`);
            // If the selected one is not the correct one, mark it as incorrect.
            if (selected && selected !== correctInput && selected.parentElement) {
                // Add the negative styling class to the wrong selected label.
                selected.parentElement.classList.add("incorrect");
            }
        }

        // Build a friendly summary message of the user’s score.
        const summaryText = `Nice job, ${trimmed}! You scored ${correctSelections}/${totalQuestions}.`;
        // Place the message into the summary box element.
        resultSummary.textContent = summaryText;
        // Ensure the summary box is visible.
        resultSummary.classList.remove("hidden");

        // Grab the scoreboard body so we can append a quick visual row right away.
        const tbody = document.querySelector("#score-table tbody");
        // Create a <tr> to hold this one attempt.
        const row = document.createElement("tr");
        // Create the name cell for that row.
        const nameCell = document.createElement("td");
        // Put the player name into the name cell.
        nameCell.textContent = trimmed;
        // Create the score cell for that row.
        const scoreCell = document.createElement("td");
        // Put the "correct/total" text into the score cell.
        scoreCell.textContent = `${correctSelections}/${totalQuestions}`;
        // Append the name cell into the row.
        row.appendChild(nameCell);
        // Append the score cell into the row.
        row.appendChild(scoreCell);
        // Append the row into the table body (displayScores will soon repaint).
        tbody.appendChild(row);

        // Persist this score to localStorage so it remains after a reload.
        saveScoreToStorage(trimmed, correctSelections, totalQuestions);
        // Re-render the scoreboard from storage (and apply sorting + filter + top/average).
        displayScores();

        // Reveal the New Player button to allow another run.
        newPlayerButton.classList.remove("hidden");
        // Disable the submit button so the same answers are not submitted twice.
        document.getElementById("submit-game").disabled = true;
    }

    // Read the saved sort preference or default to "newest".
    function getSortPreference() {
        // Grab the stored preference (may be null if never set).
        const pref = localStorage.getItem("scoreSort");
        // Return the saved value or the default option.
        return pref || "newest";
    }

    // Apply the saved sort preference to the <select> when the page loads.
    function applySavedSortPreference() {
        // Read the current preference value from storage.
        const pref = getSortPreference();
        // Set the <select>’s value so the UI reflects the saved choice.
        sortSelect.value = pref;
    }

    // Return the current filter string from the input (trimmed) (Commit 10).
    function getFilterValue() {
        // Read the filter input’s value and trim whitespace.
        return (filterInput.value || "").trim();
    }

    // Apply the saved filter value to the input on load (Commit 10).
    function applySavedFilter() {
        // Read any previously saved filter string from localStorage.
        const saved = localStorage.getItem("scoreFilter");
        // If there was a saved value, set it into the input field.
        if (saved !== null) {
            // Put the saved filter back so the UI matches stored state.
            filterInput.value = saved;
        }
    }

    // Safely read and parse the scores array from localStorage.
    function getScoresFromStorage() {
        // Retrieve the raw JSON string for "scores".
        const raw = localStorage.getItem("scores");
        // If nothing is stored yet, return an empty array.
        if (!raw) return [];
        // Try to parse the JSON string into an array.
        try {
            // Convert text into a JavaScript array of score objects.
            return JSON.parse(raw);
        // If parsing fails, we’ll catch to keep the app running.
        } catch (e) {
            // Log the parsing error for troubleshooting.
            console.error("Invalid scores in storage:", e);
            // Return an empty array rather than crashing.
            return [];
        }
    }

    // Save a scores array back into localStorage.
    function setScoresInStorage(scoresArray) {
        // Convert the array to a JSON string for storage.
        const text = JSON.stringify(scoresArray);
        // Store the string under the "scores" key.
        localStorage.setItem("scores", text);
    }

    // Append a single score record into persistent storage (with timestamp).
    function saveScoreToStorage(name, correct, total) {
        // Read the existing array from storage (or start with an empty one).
        const scores = getScoresFromStorage();
        // Build a new score record with name, counts, and a timestamp.
        const record = { name: name, correct: correct, total: total, ts: Date.now() };
        // Push the new record into the in-memory array.
        scores.push(record);
        // Persist the updated array back into storage.
        setScoresInStorage(scores);
    }

    // Render the scoreboard rows from storage, apply sorting, and compute top/average respecting the filter.
    function displayScores() {
        // Select the scoreboard <tbody> so we can fill it with rows.
        const tbody = document.querySelector("#score-table tbody");
        // Clear any existing rows so we don’t duplicate them.
        tbody.innerHTML = "";
        // Read the saved scores array from storage.
        const scores = getScoresFromStorage();
        // Read the currently selected sort preference.
        const pref = getSortPreference();
        // Read the current filter string (lower-cased for case-insensitive matching).
        const filter = getFilterValue().toLowerCase();

        // Sort based on the chosen mode (newest/oldest/highest/lowest).
        if (pref === "newest") {
            // Sort by timestamp descending so newest come first.
            scores.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        } else if (pref === "oldest") {
            // Sort by timestamp ascending so oldest come first.
            scores.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        } else if (pref === "highest") {
            // Sort by best ratio (correct/total) descending; break ties by newest.
            scores.sort((a, b) => {
                // Compute ratios safely (guard against zero totals).
                const ra = a.total ? a.correct / a.total : 0;
                const rb = b.total ? b.correct / b.total : 0;
                // If the ratios differ, sort by them.
                if (rb !== ra) return rb - ra;
                // Otherwise, newer timestamps win ties.
                return (b.ts || 0) - (a.ts || 0);
            });
        } else if (pref === "lowest") {
            // Sort by worst ratio ascending; break ties by oldest.
            scores.sort((a, b) => {
                // Compute safe ratios again.
                const ra = a.total ? a.correct / a.total : 0;
                const rb = b.total ? b.correct / b.total : 0;
                // Sort by ratio ascending (lower first).
                if (ra !== rb) return ra - rb;
                // If tied, older timestamps first.
                return (a.ts || 0) - (b.ts || 0);
            });
        }

        // Build the visible array by applying the substring filter on names (case-insensitive).
        const visible = filter
            // Keep only rows whose name includes the filter text.
            ? scores.filter((s) => (s.name || "").toLowerCase().includes(filter))
            // If no filter, copy the array to avoid mutating the original reference.
            : scores.slice();

        // Compute the absolute best integer percentage across the *visible* scores.
        let topPercent = null;
        // If there are any visible scores, scan to find the maximum integer percentage.
        if (visible.length > 0) {
            // Reduce across the array to compute the maximum percent value.
            topPercent = visible.reduce((best, s) => {
                // Compute this row’s percentage as a whole number (0–100).
                const pct = Math.round((s.total ? (s.correct / s.total) : 0) * 100);
                // Keep whichever is larger: current best or this row’s percent.
                return pct > best ? pct : best;
            }, 0);
        }

        // Track how many rows achieve that top percentage (for ties).
        let topCount = 0;
        // Track totals for a weighted average (sum of correct and sum of totals).
        let sumCorrect = 0;
        let sumTotal = 0;

        // Create and append a table row for each visible record.
        visible.forEach(function (s) {
            // Create the table row element.
            const tr = document.createElement("tr");
            // If a top percent exists, compute this row’s percent and compare.
            if (topPercent !== null) {
                // Compute this row’s integer percentage.
                const pct = Math.round(((s.total ? s.correct / s.total : 0) * 100));
                // If it equals the best, mark the row and count it.
                if (pct === topPercent) {
                    // Add a CSS class that tints the best results.
                    tr.classList.add("top");
                    // Increment the number of top-scoring rows.
                    topCount++;
                }
            }
            // Accumulate totals to compute a *weighted* average across visible rows.
            sumCorrect += s.correct || 0;
            sumTotal += s.total || 0;

            // Create the name cell for the row.
            const tdName = document.createElement("td");
            // Put the player’s name into that cell.
            tdName.textContent = s.name;
            // Create the score cell for the row.
            const tdScore = document.createElement("td");
            // Put "correct/total" text into that cell.
            tdScore.textContent = s.correct + "/" + s.total;
            // Append the name cell into the row.
            tr.appendChild(tdName);
            // Append the score cell into the row.
            tr.appendChild(tdScore);
            // Append the completed row into the table body.
            tbody.appendChild(tr);
        });

        // Update the Top Score summary box using the *visible* subset.
        if (visible.length === 0) {
            // Clear any previous text in the top-score box.
            topScoreBox.textContent = "";
            // Hide the box so it doesn’t take space.
            topScoreBox.classList.add("hidden");
        } else {
            // Determine singular/plural form for “player(s)” in the message.
            const label = topCount === 1 ? "player" : "players";
            // Build the message like “Top score: 90% (2 players)”.
            const summary = "🏆 Top score: " + topPercent + "% (" + topCount + " " + label + ")";
            // Put the message into the box.
            topScoreBox.textContent = summary;
            // Make sure the box is visible.
            topScoreBox.classList.remove("hidden");
        }

        // Update the Average summary box using a *weighted* average across visible rows (Commit 10).
        if (visible.length === 0 || sumTotal === 0) {
            // Clear and hide the average box when no data is visible.
            avgScoreBox.textContent = "";
            // Hide the element when not applicable.
            avgScoreBox.classList.add("hidden");
        } else {
            // Compute weighted average as totalCorrect / totalQuestions * 100 (rounded).
            const avgPercent = Math.round((sumCorrect / sumTotal) * 100);
            // Build a message like “Average (filtered): 72% across 5 game(s)”.
            const msg = "📊 Average (filtered): " + avgPercent + "% across " + visible.length + " game" + (visible.length === 1 ? "" : "s");
            // Put the message into the box.
            avgScoreBox.textContent = msg;
            // Ensure the average box is visible.
            avgScoreBox.classList.remove("hidden");
        }
    }

    // Prefill the username field from localStorage if present.
    function checkUsername() {
        // Read the saved current user name (if any).
        const stored = localStorage.getItem("triviaCurrentUser");
        // If a saved value exists, put it into the input field.
        if (stored) {
            // Set the input’s value so the user doesn’t need to retype it.
            usernameInput.value = stored;
        }
    }

    // Reset the UI so a new player can start and fetch a new set of questions.
    function newPlayer() {
        // Clear the name input field.
        usernameInput.value = "";
        // Remove the saved current user so we start fresh next time.
        localStorage.removeItem("triviaCurrentUser");
        // Re-enable the submit button for the next attempt.
        document.getElementById("submit-game").disabled = false;
        // Hide the New Player button until the next submission.
        newPlayerButton.classList.add("hidden");
        // Remove any old questions from the container.
        questionContainer.innerHTML = "";
        // Show the loader while the new set downloads.
        showLoading(true);
        // Request a new batch of questions from the API.
        fetchQuestions();
        // Put the keyboard cursor back into the name field for convenience.
        usernameInput.focus();
        // Scroll back to the top of the page to start clean.
        window.scrollTo(0, 0);
    }

    // Ask for confirmation and clear all stored scores if the user agrees.
    function clearScores() {
        // Show a confirmation dialog to prevent accidental deletion.
        const ok = window.confirm("Clear all saved scores? This cannot be undone.");
        // If the user confirmed, remove the scores and refresh the table.
        if (ok) {
            // Remove the localStorage key that holds the scores array.
            localStorage.removeItem("scores");
            // Re-render the now-empty scoreboard.
            displayScores();
        }
    }
});
// End of the DOMContentLoaded handler.
