// Provide a high-level description of the script’s purpose.
/**
 * Initializes the Trivia Game when the DOM is fully loaded.
 * Final commit adds: consent-based "Remember my name" + "Forget me" and an aria-live summary.
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
    // Cache a reference to the sort select control for the scoreboard.
    const sortSelect = document.getElementById("sort-scores");
    // Cache a reference to the top score summary box.
    const topScoreBox = document.getElementById("top-score");
    // Cache a reference to the privacy controls (final commit).
    const rememberCheckbox = document.getElementById("remember-me");
    // Cache a reference to the "Forget me" button (final commit).
    const forgetButton = document.getElementById("forget-me");

    // Prefill the username and sync consent controls from storage.
    checkUsername();
    // Apply the saved sort preference to the select control.
    applySavedSortPreference();
    // Fetch questions from the API and render them with a loading state.
    fetchQuestions();
    // Render any saved scores immediately (sorting + top score + empty state).
    displayScores();

    // Listen for typing in the username field so we conditionally persist it.
    usernameInput.addEventListener("input", function () {
        // Read and trim the current value to avoid saving stray spaces.
        const value = (usernameInput.value || "").trim();
        // If user opted in and a value exists, store it; otherwise remove the stored name.
        if (rememberCheckbox.checked && value) {
            // Save the name to localStorage so it can be restored later.
            localStorage.setItem("triviaCurrentUser", value);
            // Show the Forget Me button when a name is stored.
            forgetButton.classList.remove("hidden");
        } else {
            // Remove the stored name when not opted-in or value is empty.
            localStorage.removeItem("triviaCurrentUser");
            // Hide the Forget Me button accordingly.
            forgetButton.classList.add("hidden");
        }
    });

    // When the Remember checkbox changes, update storage to match consent.
    rememberCheckbox.addEventListener("change", function () {
        // Read and trim the current name value.
        const value = (usernameInput.value || "").trim();
        // If checked and there's a name, store it; otherwise clear it.
        if (rememberCheckbox.checked && value) {
            // Persist the name with user consent.
            localStorage.setItem("triviaCurrentUser", value);
            // Reveal the Forget Me button to allow opting out later.
            forgetButton.classList.remove("hidden");
        } else {
            // Remove the stored name when not opted-in or field is empty.
            localStorage.removeItem("triviaCurrentUser");
            // Hide the Forget Me button in this case.
            forgetButton.classList.add("hidden");
        }
    });

    // When "Forget me" is clicked, clear any stored name and reset controls.
    forgetButton.addEventListener("click", function () {
        // Remove the persisted name from localStorage.
        localStorage.removeItem("triviaCurrentUser");
        // Clear the visible input field value.
        usernameInput.value = "";
        // Uncheck the consent checkbox.
        rememberCheckbox.checked = false;
        // Hide the Forget Me button to reflect the cleared state.
        forgetButton.classList.add("hidden");
        // Place focus back in the name field for convenience.
        usernameInput.focus();
    });

    // When the sort selection changes, save the preference and re-render the table.
    sortSelect.addEventListener("change", function () {
        // Save the chosen sort option to localStorage.
        localStorage.setItem("scoreSort", sortSelect.value);
        // Repaint the scoreboard to reflect the new order.
        displayScores();
    });

    // Document what the fetchQuestions function does in this block comment.
    /**
     * Fetches trivia questions from the API and displays them.
     */
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

    // Helper that flips visibility between loader and questions.
    /**
     * Toggles the display of the loading state and question container.
     *
     * @param {boolean} isLoading - Indicates whether the loading state should be shown.
     */
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
        } else {
            // Add the 'hidden' class to the loader to hide it.
            loadingEl.classList.add("hidden");
            // Remove the 'hidden' class from the questions to show them.
            questionsEl.classList.remove("hidden");
        }
    }

    // Render the fetched questions into the DOM.
    /**
     * Displays fetched trivia questions.
     * @param {Object[]} questions - Array of trivia questions.
     */
    function displayQuestions(questions) {
        // Clear any existing question blocks so we start fresh.
        questionContainer.innerHTML = "";
        // Loop over the array of question objects and render each one.
        questions.forEach((question, index) => {
            // Create a container <div> for the question block.
            const questionDiv = document.createElement("div");
            // Insert the prompt and randomized answers.
            questionDiv.innerHTML = `
                <p>${question.question}</p>
                ${createAnswerOptions(
                    question.correct_answer,
                    question.incorrect_answers,
                    index
                )}
            `;
            // Append the question block to the overall container.
            questionContainer.appendChild(questionDiv);
        });
    }

    // Build the set of radio options for a given question.
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
        // Merge and shuffle the answer list for random order.
        const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
            () => Math.random() - 0.5
        );
        // Map answers to label+radio markup, marking the correct one with data attribute.
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
            // Combine all option strings into one HTML snippet.
            .join("");
    }

    // Wire up form submit, new player, and clear scores buttons.
    form.addEventListener("submit", handleFormSubmit);
    newPlayerButton.addEventListener("click", newPlayer);
    clearScoresButton.addEventListener("click", clearScores);

    // Handle the form submission: validate, score, persist, and update UI.
    /**
     * Handles the trivia form submission.
     * @param {Event} event - The submit event.
     */
    function handleFormSubmit(event) {
        // Prevent normal form submission (page reload).
        event.preventDefault();

        // Grab every question block so we can check if each is answered.
        const blocks = document.querySelectorAll("#question-container > div");
        // Track the first unanswered block to guide the user.
        let firstUnanswered = null;
        // Check each block for a checked radio input.
        blocks.forEach((_, i) => {
            // Build a selector for the checked radio in this group.
            const sel = `input[name="answer${i}"]:checked`;
            // Find the selected input (if any).
            const selected = document.querySelector(sel);
            // Grab the block to toggle error styling.
            const blockEl = blocks[i];
            // If nothing is checked, mark this block invalid and remember it.
            if (!selected) {
                blockEl.classList.add("invalid");
                if (!firstUnanswered) firstUnanswered = blockEl;
            } else {
                // If answered, make sure any previous invalid style is removed.
                blockEl.classList.remove("invalid");
            }
        });

        // If we found an unanswered question, help the user and abort submit.
        if (firstUnanswered) {
            // Alert the user to complete all questions.
            alert("Please answer all questions before submitting.");
            // Focus the first radio in that block for convenience.
            const firstRadio = firstUnanswered.querySelector('input[type="radio"]');
            // Focus it if found.
            if (firstRadio) firstRadio.focus();
            // Scroll the block into view to make it obvious.
            firstUnanswered.scrollIntoView({ behavior: "smooth", block: "center" });
            // Stop here until all questions are answered.
            return;
        }

        // Read and trim the player’s name from the input.
        const trimmed = (usernameInput.value || "").trim();
        // Require a non-empty name before scoring.
        if (!trimmed) {
            // Ask the user to enter their name first.
            alert("Please enter your name before finishing the game.");
            // Put focus back in the name box.
            usernameInput.focus();
            // Abort submission due to missing name.
            return;
        }

        // Count how many questions we had on screen.
        const totalQuestions = blocks.length;
        // Count the number of correct answers selected.
        const correctSelections = document.querySelectorAll(
            'input[type="radio"][data-correct="true"]:checked'
        ).length;

        // Walk through questions to visually mark correct and selected-incorrect labels.
        for (let i = 0; i < totalQuestions; i++) {
            // Find the correct input for this question.
            const correctInput = document.querySelector(
                `input[name="answer${i}"][data-correct="true"]`
            );
            // If found, mark its label as correct.
            if (correctInput && correctInput.parentElement) {
                correctInput.parentElement.classList.add("correct");
            }
            // Look up the selected input for this question.
            const selected = document.querySelector(`input[name="answer${i}"]:checked`);
            // If selected exists and is wrong, mark its label as incorrect.
            if (selected && selected !== correctInput && selected.parentElement) {
                selected.parentElement.classList.add("incorrect");
            }
        }

        // Build a human-friendly score message.
        const summaryText = `Nice job, ${trimmed}! You scored ${correctSelections}/${totalQuestions}.`;
        // Put the summary into the aria-live box so assistive tech announces it.
        resultSummary.textContent = summaryText;
        // Make sure the summary box is visible.
        resultSummary.classList.remove("hidden");

        // Capture the current timestamp for this attempt.
        const nowTs = Date.now();

        // Add a quick, immediate row to the table for continuity.
        const tbody = document.querySelector("#score-table tbody");
        // Build a new table row element.
        const row = document.createElement("tr");
        // Create and fill a cell for the name.
        const nameCell = document.createElement("td");
        nameCell.textContent = trimmed;
        // Create and fill a cell for the score.
        const scoreCell = document.createElement("td");
        scoreCell.textContent = `${correctSelections}/${totalQuestions}`;
        // Create and fill a cell for the date/time.
        const dateCell = document.createElement("td");
        dateCell.textContent = new Date(nowTs).toLocaleString();
        // Append the cells to the row in order.
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        row.appendChild(dateCell);
        // Append the row to the table body.
        tbody.appendChild(row);

        // Persist the score to localStorage so it remains across reloads.
        saveScoreToStorage(trimmed, correctSelections, totalQuestions);
        // Respect consent: if Remember is checked, store the name; otherwise remove it.
        if (rememberCheckbox.checked) {
            localStorage.setItem("triviaCurrentUser", trimmed);
            forgetButton.classList.remove("hidden");
        } else {
            localStorage.removeItem("triviaCurrentUser");
            forgetButton.classList.add("hidden");
        }
        // Re-render the scoreboard from storage for consistent sorting/formatting.
        displayScores();

        // Reveal the New Player button so another attempt can be made.
        newPlayerButton.classList.remove("hidden");
        // Disable the submit button to prevent duplicate submissions for the same attempt.
        document.getElementById("submit-game").disabled = true;
    }

    // Return the current sort preference from localStorage or a default.
    function getSortPreference() {
        // Pull the saved preference (if any).
        const pref = localStorage.getItem("scoreSort");
        // Default to "newest" when nothing saved.
        return pref || "newest";
    }

    // Apply the saved sort preference to the select control on load.
    function applySavedSortPreference() {
        // Read the preference value.
        const pref = getSortPreference();
        // Set the select’s value to mirror stored preference.
        sortSelect.value = pref;
    }

    // Safely read and parse the scores array from localStorage.
    function getScoresFromStorage() {
        // Retrieve the raw JSON string for "scores".
        const raw = localStorage.getItem("scores");
        // If nothing is stored yet, return an empty array.
        if (!raw) return [];
        // Attempt to parse the JSON into an array.
        try {
            return JSON.parse(raw);
        } catch (e) {
            // Log a warning and return empty if parsing fails.
            console.error("Invalid scores in storage:", e);
            return [];
        }
    }

    // Save a scores array back into localStorage.
    function setScoresInStorage(scoresArray) {
        // Convert the array to text.
        const text = JSON.stringify(scoresArray);
        // Store it under the "scores" key.
        localStorage.setItem("scores", text);
    }

    // Append a single score record (with timestamp) into persistent storage.
    function saveScoreToStorage(name, correct, total) {
        // Read the existing scores array (or an empty array).
        const scores = getScoresFromStorage();
        // Construct a record object for this attempt.
        const record = { name: name, correct: correct, total: total, ts: Date.now() };
        // Push the new record into the array.
        scores.push(record);
        // Store the updated array back to localStorage.
        setScoresInStorage(scores);
    }

    // Render the scoreboard rows from storage, apply sorting, and update the top-score/empty-state UI.
    function displayScores() {
        // Grab the <tbody> we will populate.
        const tbody = document.querySelector("#score-table tbody");
        // Clear any old rows.
        tbody.innerHTML = "";
        // Read stored scores and sort preference.
        const scores = getScoresFromStorage();
        const pref = getSortPreference();

        // If there are no scores, render a placeholder and disable Clear.
        if (scores.length === 0) {
            // Build a single-row placeholder to explain there is no data.
            const emptyTr = document.createElement("tr");
            emptyTr.className = "empty";
            const emptyTd = document.createElement("td");
            emptyTd.setAttribute("colspan", "3");
            emptyTd.textContent = "No scores yet.";
            emptyTr.appendChild(emptyTd);
            tbody.appendChild(emptyTr);
            // Disable Clear button because there is nothing to remove.
            clearScoresButton.disabled = true;
            // Hide the top-score summary in this state.
            topScoreBox.textContent = "";
            topScoreBox.classList.add("hidden");
            // Stop here—nothing else to render.
            return;
        }

        // We do have data: enable the Clear button.
        clearScoresButton.disabled = false;

        // Sort the scores according to the chosen preference.
        if (pref === "newest") {
            scores.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        } else if (pref === "oldest") {
            scores.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        } else if (pref === "highest") {
            scores.sort((a, b) => {
                const ra = a.total ? a.correct / a.total : 0;
                const rb = b.total ? b.correct / b.total : 0;
                if (rb !== ra) return rb - ra;
                return (b.ts || 0) - (a.ts || 0);
            });
        } else if (pref === "lowest") {
            scores.sort((a, b) => {
                const ra = a.total ? a.correct / a.total : 0;
                const rb = b.total ? b.correct / b.total : 0;
                if (ra !== rb) return ra - rb;
                return (a.ts || 0) - (b.ts || 0);
            });
        }

        // Compute the top percentage across all scores for highlighting.
        let topPercent = scores.reduce((best, s) => {
            const pct = Math.round((s.total ? (s.correct / s.total) : 0) * 100);
            return pct > best ? pct : best;
        }, 0);
        // Track how many rows reach that top percentage.
        let topCount = 0;

        // Create and append a table row for each saved record.
        scores.forEach(function (s) {
            // Create a table row element for this saved record.
            const tr = document.createElement("tr");
            // Compute this record’s integer percentage for highlighting.
            const pct = Math.round(((s.total ? s.correct / s.total : 0) * 100));
            // If this record matches the top percentage, mark it and bump the count.
            if (pct === topPercent) {
                tr.classList.add("top");
                topCount++;
            }
            // Create and fill cells for name, score, and date.
            const tdName = document.createElement("td");
            tdName.textContent = s.name;
            const tdScore = document.createElement("td");
            tdScore.textContent = s.correct + "/" + s.total;
            const tdDate = document.createElement("td");
            tdDate.textContent = typeof s.ts === "number" ? new Date(s.ts).toLocaleString() : "—";
            // Append the cells and row to the table.
            tr.appendChild(tdName);
            tr.appendChild(tdScore);
            tr.appendChild(tdDate);
            tbody.appendChild(tr);
        });

        // Build the top-score summary and reveal it.
        const label = topCount === 1 ? "player" : "players";
        const summary = "🏆 Top score: " + topPercent + "% (" + topCount + " " + label + ")";
        topScoreBox.textContent = summary;
        topScoreBox.classList.remove("hidden");
    }

    // Prefill the username from localStorage and sync privacy controls.
    function checkUsername() {
        // Read any saved name for the current user from localStorage.
        const stored = localStorage.getItem("triviaCurrentUser");
        // If a stored value exists, place it into the input and reflect consent.
        if (stored) {
            usernameInput.value = stored;
            rememberCheckbox.checked = true;
            forgetButton.classList.remove("hidden");
        } else {
            rememberCheckbox.checked = false;
            forgetButton.classList.add("hidden");
        }
    }

    // Begin a new player session by resetting UI state and fetching fresh questions.
    function newPlayer() {
        // Clear the name input field.
        usernameInput.value = "";
        // Remove the saved name unless the user keeps consent and types again.
        localStorage.removeItem("triviaCurrentUser");
        // Clear consent controls to default off.
        rememberCheckbox.checked = false;
        forgetButton.classList.add("hidden");
        // Re-enable the submit button for the next attempt.
        document.getElementById("submit-game").disabled = false;
        // Hide the New Player button until the next submission.
        newPlayerButton.classList.add("hidden");
        // Remove any old questions and result summary.
        questionContainer.innerHTML = "";
        resultSummary.classList.add("hidden");
        resultSummary.textContent = "";
        // Show the loader while new questions download.
        showLoading(true);
        // Fetch a fresh set of questions to start a new round.
        fetchQuestions();
        // Focus the name field for convenience.
        usernameInput.focus();
        // Scroll to the top for a clean start.
        window.scrollTo(0, 0);
    }

    // Ask for confirmation and clear all stored scores if the user agrees.
    function clearScores() {
        // Confirm the destructive action with the user.
        const ok = window.confirm("Clear all saved scores? This cannot be undone.");
        // If confirmed, clear and re-render the scoreboard.
        if (ok) {
            localStorage.removeItem("scores");
            displayScores();
        }
    }
});
// End of DOMContentLoaded handler.
