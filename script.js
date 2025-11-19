// Provide a high-level description of the script’s purpose.
/**
 * Initializes the Trivia Game when the DOM is fully loaded.
 * Previous commits added: loader, rendering, validation, per-question feedback, storage with sorting,
 * Top Score, filter + average (Commit 10), and now (Commit 11) scoreboard empty-state placeholders
 * plus disabling Clear Scores when there is nothing to clear.
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
    // Cache a reference to the username input for prefill/validation.
    const usernameInput = document.getElementById("username");
    // Cache a reference to the result summary box shown after submission.
    const resultSummary = document.getElementById("result-summary");
    // Cache a reference to the sort select control for the scoreboard.
    const sortSelect = document.getElementById("sort-scores");
    // Cache a reference to the filter input (Commit 10).
    const filterInput = document.getElementById("filter-player");
    // Cache a reference to the top score summary box.
    const topScoreBox = document.getElementById("top-score");
    // Cache a reference to the average summary box (Commit 10).
    const avgScoreBox = document.getElementById("avg-score");
    // Cache a reference to the Remember Me checkbox (Commit 10).
    const rememberCheckbox = document.getElementById("remember-me");
    // Cache a reference to the Forget Me button (Commit 10).
    const forgetButton = document.getElementById("forget-me");

    // On load, prefill the username from localStorage and sync remember controls.
    checkUsername();
    // On load, apply the saved sort preference to the select control.
    applySavedSortPreference();
    // On load, apply the saved filter text (Commit 10).
    applySavedFilter();
    // Fetch a fresh set of questions to display to the player.
    fetchQuestions();
    // Render any previously saved scores from localStorage at startup (sorted + summaries).
    displayScores();

    // Listen for typing in the username field so we conditionally persist it (Commit 10 logic).
    usernameInput.addEventListener("input", function () {
        // Read the current value and trim whitespace.
        const value = (usernameInput.value || "").trim();
        // If Remember is checked and the value is non-empty, store it; otherwise remove it.
        if (rememberCheckbox && rememberCheckbox.checked && value) {
            // Persist the current user’s name for convenience on reload.
            localStorage.setItem("triviaCurrentUser", value);
            // Ensure the Forget Me button is visible when a name is stored.
            forgetButton.classList.remove("hidden");
        } else {
            // Remove the saved value to avoid stale or unwanted storage.
            localStorage.removeItem("triviaCurrentUser");
            // Hide the Forget Me button when nothing is stored.
            forgetButton.classList.add("hidden");
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

    // Listen for Remember Me checkbox changes (Commit 10).
    rememberCheckbox.addEventListener("change", function () {
        // Read current trimmed input value.
        const value = (usernameInput.value || "").trim();
        // If checked and there is a value, store it; if unchecked, remove it.
        if (rememberCheckbox.checked && value) {
            // Save the name since the user opted in.
            localStorage.setItem("triviaCurrentUser", value);
            // Show the Forget Me control to allow opting out later.
            forgetButton.classList.remove("hidden");
        } else {
            // Remove the stored name as the user opted out or field is empty.
            localStorage.removeItem("triviaCurrentUser");
            // Hide the Forget Me control accordingly.
            forgetButton.classList.add("hidden");
        }
    });

    // Listen for Forget Me clicks to clear the stored name and reset controls (Commit 10).
    forgetButton.addEventListener("click", function () {
        // Remove any stored current user name.
        localStorage.removeItem("triviaCurrentUser");
        // Clear the name field visually.
        usernameInput.value = "";
        // Uncheck Remember Me because nothing is stored now.
        rememberCheckbox.checked = false;
        // Hide the Forget Me button to reflect the cleared state.
        forgetButton.classList.add("hidden");
        // Focus the name field for convenience.
        usernameInput.focus();
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
        // Toggle classes based on loading state per module guidance.
        if (isLoading) {
            // Reveal the loader by removing the 'hidden' class.
            loadingEl.classList.remove("hidden");
            // Hide questions by adding the 'hidden' class.
            questionsEl.classList.add("hidden");
        } else {
            // Hide the loader by adding the 'hidden' class.
            loadingEl.classList.add("hidden");
            // Reveal questions by removing the 'hidden' class.
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
            // Alert the user to complete all questions before submitting.
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

        // Store or remove the current user depending on the Remember Me opt-in (Commit 10).
        if (rememberCheckbox.checked && trimmed) {
            // Save the name since the user opted in.
            localStorage.setItem("triviaCurrentUser", trimmed);
            // Show Forget Me because a name is stored.
            forgetButton.classList.remove("hidden");
        } else {
            // Remove the stored name since there is no opt-in.
            localStorage.removeItem("triviaCurrentUser");
            // Hide Forget Me in this case.
            forgetButton.classList.add("hidden");
        }

        // Re-render the scoreboard from storage so it reflects the saved list and current sort/filter.
        displayScores();

        // Reveal the "New Player" button so another attempt can be made.
        newPlayerButton.classList.remove("hidden");
        // Disable the submit button to prevent duplicate submissions for the same attempt.
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

    // Return the current filter string (trimmed) from the input (Commit 10).
    function getFilterValue() {
        // Read and trim the filter input’s value.
        return (filterInput.value || "").trim();
    }

    // Apply the saved filter value to the input on load (Commit 10).
    function applySavedFilter() {
        // Read any previously saved filter string from localStorage.
        const saved = localStorage.getItem("scoreFilter");
        // If something was saved, restore it to the input.
        if (saved !== null) {
            // Set the input so the UI matches stored state.
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

    // Render the scoreboard rows from storage, apply sort/filter, and compute summaries.
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

        // Enable or disable the Clear Scores button depending on stored data (Commit 11).
        clearScoresButton.disabled = scores.length === 0;

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

        // If there are no rows to show, insert a placeholder message row (Commit 11).
        if (visible.length === 0) {
            // Create a <tr> that will hold a single message cell.
            const emptyRow = document.createElement("tr");
            // Add a class so we can style it differently.
            emptyRow.classList.add("placeholder");
            // Create the single cell that spans both columns.
            const td = document.createElement("td");
            // Make the cell span two columns to match the table layout.
            td.setAttribute("colspan", "2");
            // Decide which message to show based on whether any scores exist at all.
            td.textContent = scores.length === 0
                ? "No scores yet."
                : "No scores match the current filter.";
            // Append the cell to the row.
            emptyRow.appendChild(td);
            // Append the row to the table body.
            tbody.appendChild(emptyRow);
            // Since nothing is visible, hide both summary boxes for clarity.
            topScoreBox.textContent = "";
            topScoreBox.classList.add("hidden");
            avgScoreBox.textContent = "";
            avgScoreBox.classList.add("hidden");
            // Stop here; there is no more to render.
            return;
        }

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
        const label = topCount === 1 ? "player" : "players";
        // Build the message like “Top score: 90% (2 players)”.
        const summary = "🏆 Top score: " + topPercent + "% (" + topCount + " " + label + ")";
        // Put the message into the box.
        topScoreBox.textContent = summary;
        // Make sure the box is visible.
        topScoreBox.classList.remove("hidden");

        // Update the Average summary box using a *weighted* average across visible rows (Commit 10).
        const avgPercent = Math.round((sumCorrect / sumTotal) * 100);
        // Build a message like “Average (filtered): 72% across N game(s)”.
        const msg = "📊 Average (filtered): " + avgPercent + "% across " + visible.length + " game" + (visible.length === 1 ? "" : "s");
        // Put the message into the box.
        avgScoreBox.textContent = msg;
        // Ensure the average box is visible.
        avgScoreBox.classList.remove("hidden");
    }

    // Prefill the username and sync Remember/Forget controls from localStorage (Commit 10).
    function checkUsername() {
        // Read any saved name for the current user from localStorage.
        const stored = localStorage.getItem("triviaCurrentUser");
        // If a stored value exists, put it into the input and reflect opt-in controls.
        if (stored) {
            // Prefill the username input with the stored value.
            usernameInput.value = stored;
            // Mark the Remember checkbox as opted-in because storage exists.
            rememberCheckbox.checked = true;
            // Show the Forget Me button to allow opting out.
            forgetButton.classList.remove("hidden");
        } else {
            // Ensure the checkbox is cleared if nothing is stored.
            rememberCheckbox.checked = false;
            // Hide the Forget Me button in this case.
            forgetButton.classList.add("hidden");
        }
    }

    // Begin a new player session by resetting UI state and fetching fresh questions.
    function newPlayer() {
        // Clear any previously entered name from the input.
        usernameInput.value = "";
        // Remove the saved current user so the field is blank next time.
        localStorage.removeItem("triviaCurrentUser");
        // Also reflect that removal in the controls: uncheck Remember and hide Forget Me.
        rememberCheckbox.checked = false;
        forgetButton.classList.add("hidden");
        // Re-enable the submit button so the next submission is allowed.
        document.getElementById("submit-game").disabled = false;
        // Hide the New Player button again until after the next submission.
        newPlayerButton.classList.add("hidden");
        // Clear the existing questions so the next set won’t stack with the old ones.
        questionContainer.innerHTML = "";
        // Hide the result summary so the new round starts clean.
        resultSummary.classList.add("hidden");
        // Clear any previous message in the summary box.
        resultSummary.textContent = "";
        // Show the loader while fetching new questions.
        showLoading(true);
        // Fetch a fresh set of questions to start a new round.
        fetchQuestions();
        // Put keyboard focus back into the name field for convenience.
        usernameInput.focus();
        // Scroll to the top so the form is fully visible.
        window.scrollTo(0, 0);
    }

    // Implement the Clear Scores behavior.
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
