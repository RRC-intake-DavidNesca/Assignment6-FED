/**
 * Initializes the Trivia Game
 */

// This line runs our setup after the initial HTML has been parsed
document.addEventListener("DOMContentLoaded", function () {
    // This line caches the trivia form element to manage submission
    const form = document.getElementById("trivia-form");
    // This line caches the container where questions are rendered
    const questionContainer = document.getElementById("question-container");
    // This line caches the New Player button to reset for another round
    const newPlayerButton = document.getElementById("new-player");
    // This line caches the Clear Scores button to wipe score history only
    const clearScoresButton = document.getElementById("clear-scores");
    // This line caches the Clear All Data button to wipe scores and saved username
    const clearAllButton = document.getElementById("clear-all");

    // This line pre-fills the username from localStorage if previously saved
    checkUsername(); // Uses DOM + localStorage per Module 6. :contentReference[oaicite:2]{index=2}
    // This line fetches a fresh set of questions from the trivia API
    fetchQuestions();
    // This line renders any existing scores from localStorage into the table
    displayScores();

    // This JSDoc explains the function that retrieves and displays questions
    /**
     * Fetches trivia questions from the API and displays them.
     */
    // This function shows the loader, fetches JSON, renders questions, and hides the loader
    function fetchQuestions() {
        // This line shows the skeleton loader while the network request is in flight
        showLoading(true); // Show loading state

        // This line calls the Open Trivia DB API for 10 multiple-choice questions
        fetch("https://opentdb.com/api.php?amount=10&type=multiple")
            // This line parses the JSON body of the response
            .then((response) => response.json())
            // This line handles the parsed response data
            .then((data) => {
                // This line renders all returned questions into the DOM
                displayQuestions(data.results);
                // This line hides the loader and reveals the questions
                showLoading(false); // Hide loading state
            })
            // This line handles network or parsing errors gracefully
            .catch((error) => {
                // This line logs the error for debugging
                console.error("Error fetching questions:", error);
                // This line hides the loader even when an error occurs
                showLoading(false); // Hide loading state on error
            });
    }

    // This JSDoc describes the loader visibility toggling helper
    /**
     * Toggles the display of the loading state and question container.
     *
     * @param {boolean} isLoading - Indicates whether the loading state should be shown.
     */
    // This function adds/removes the 'hidden' class on loader and questions
    function showLoading(isLoading) {
        // This line selects the loader container
        const loadingEl = document.getElementById("loading-container");
        // This line selects the questions container
        const questionsEl = document.getElementById("question-container");
        // This condition toggles the two areas based on loading state
        if (isLoading) {
            // This line reveals the loader by removing 'hidden'
            loadingEl.classList.remove("hidden");
            // This line hides questions by adding 'hidden'
            questionsEl.classList.add("hidden");
        } else {
            // This line hides the loader by adding 'hidden'
            loadingEl.classList.add("hidden");
            // This line reveals questions by removing 'hidden'
            questionsEl.classList.remove("hidden");
        }
    }

    // This JSDoc describes rendering behavior for fetched questions
    /**
     * Displays fetched trivia questions.
     * @param {Object[]} questions - Array of trivia questions.
     */
    // This function clears prior content and inserts blocks for each question
    function displayQuestions(questions) {
        // This line clears any previously rendered questions
        questionContainer.innerHTML = ""; // Clear existing questions
        // This line loops through the questions and index to build markup
        questions.forEach((question, index) => {
            // This line creates a wrapper for one question plus its options
            const questionDiv = document.createElement("div");
            // This line sets HTML for the question prompt and its answer options
            questionDiv.innerHTML = `
                <p>${question.question}</p>
                ${createAnswerOptions(
                    question.correct_answer,
                    question.incorrect_answers,
                    index
                )}
            `;
            // This line appends the question block into the container
            questionContainer.appendChild(questionDiv);
        });
    }

    // This JSDoc describes the answer-option markup generator
    /**
     * Creates HTML for answer options.
     * @param {string} correctAnswer - The correct answer for the question.
     * @param {string[]} incorrectAnswers - Array of incorrect answers.
     * @param {number} questionIndex - The index of the current question.
     * @returns {string} HTML string of answer options.
     */
    // This function merges/shuffles answers and returns radio inputs with labels
    function createAnswerOptions(
        correctAnswer,
        incorrectAnswers,
        questionIndex
    ) {
        // This line merges correct and incorrect arrays and shuffles them
        const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
            () => Math.random() - 0.5
        );
        // This line returns a single HTML string containing labeled radio inputs
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
            // This line joins the array of option snippets
            .join("");
    }

    // This line wires up the form submission handler
    form.addEventListener("submit", handleFormSubmit);
    // This line wires up the Clear Scores feature
    clearScoresButton.addEventListener("click", clearScores);
    // This line wires up the Clear All Data feature
    clearAllButton.addEventListener("click", clearAllData);
    // This line wires up the New Player feature
    newPlayerButton.addEventListener("click", newPlayer);

    // This JSDoc documents the submit handler logic
    /**
     * Handles the trivia form submission.
     * @param {Event} event - The submit event.
     */
    // This function validates completion, scores answers, saves, and updates UI
    function handleFormSubmit(event) {
        // This line prevents the default form submission (page reload)
        event.preventDefault();

        // This line selects all question blocks currently displayed
        const blocks = document.querySelectorAll("#question-container > div");
        // This line tracks the first unanswered block for focus/scroll behavior
        let firstUnanswered = null;
        // This line loops through each question block by its index
        blocks.forEach((_, i) => {
            // This line builds a selector for the checked radio in this question group
            const sel = `input[name="answer${i}"]:checked`;
            // This line finds the selected radio (if any)
            const selected = document.querySelector(sel);
            // This line gets the DOM element for the current block
            const blockEl = blocks[i];
            // This line checks whether the block has a selection
            if (!selected) {
                // This line adds a visual invalid state for unanswered questions
                blockEl.classList.add("invalid");
                // This line records the first unanswered block for later focus/scroll
                if (!firstUnanswered) {
                    firstUnanswered = blockEl;
                }
            } else {
                // This line removes invalid highlighting if this block is answered
                blockEl.classList.remove("invalid");
            }
        });

        // This line checks if any block was unanswered
        if (firstUnanswered) {
            // This line alerts the user to complete all questions (simple, module-level UI)
            alert("Please answer all questions before submitting.");
            // This line attempts to focus the first radio inside the first unanswered block
            const firstRadio = firstUnanswered.querySelector('input[type="radio"]');
            // This line focuses the radio input if found to guide the user
            if (firstRadio) firstRadio.focus();
            // This line scrolls the block into view so the user sees where to act
            firstUnanswered.scrollIntoView({ behavior: "smooth", block: "center" });
            // This line aborts submission to enforce completion
            return;
        }

        // This line reads and trims the player name from the username input
        const nameInput = document.getElementById("username");
        // This line stores the trimmed value
        const playerName = (nameInput.value || "").trim();
        // This line enforces that a name must be entered before submitting
        if (playerName === "") {
            // This line alerts the user to enter a name
            alert("Please enter your name before finishing the game.");
            // This line focuses the name input for convenience
            nameInput.focus();
            // This line aborts submission due to missing name
            return;
        }

        // This line counts all question blocks (total questions)
        const totalQuestions = blocks.length;
        // This line counts the number of checked radios that are marked correct
        const correctSelections = document.querySelectorAll(
            'input[type="radio"][data-correct="true"]:checked'
        ).length;

        // This line saves the username for convenience on future visits
        localStorage.setItem("username", playerName);
        // This line persists the score record using our storage helper
        saveScoreToStorage(playerName, correctSelections, totalQuestions);
        // This line re-renders the scoreboard from localStorage (authoritative list)
        displayScores();

        // This line selects the table body for a quick immediate row append (visual continuity)
        const tbody = document.querySelector("#score-table tbody");
        // This line creates the new table row
        const row = document.createElement("tr");
        // This line creates a cell for the player's name
        const nameCell = document.createElement("td");
        // This line fills the name cell with the player's name
        nameCell.textContent = playerName;
        // This line creates a cell for the score text
        const scoreCell = document.createElement("td");
        // This line sets the score cell as "correct/total"
        scoreCell.textContent = `${correctSelections}/${totalQuestions}`;
        // This line appends the cells to the row
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        // This line appends the row to the table body
        tbody.appendChild(row);

        // This line reveals the New Player button so another round can begin
        newPlayerButton.classList.remove("hidden");
        // This line disables the submit button to prevent duplicate submissions
        document.getElementById("submit-game").disabled = true;
        // This line shows a quick summary alert of the player’s score
        alert(playerName + ", your score is " + correctSelections + "/" + totalQuestions + ".");
    }

    // ---------- Storage helpers (kept from earlier commits) ----------

    // This function safely reads the scores array from localStorage
    function getScoresFromStorage() {
        // This line retrieves the JSON string for scores from localStorage
        const raw = localStorage.getItem("scores");
        // This line returns an empty array if nothing is stored
        if (!raw) {
            return [];
        }
        // This line attempts to parse the JSON text into a JavaScript array
        try {
            // This line parses and returns the array of score objects
            return JSON.parse(raw);
        } catch (e) {
            // This line logs invalid storage data as a console error
            console.error("Invalid scores in storage:", e); // :contentReference[oaicite:3]{index=3}
            // This line returns an empty list so the app continues to function
            return [];
        }
    }

    // This function writes the provided scores array back to localStorage
    function setScoresInStorage(scoresArray) {
        // This line converts the array into a JSON string
        const text = JSON.stringify(scoresArray); // JSON methods per notes. :contentReference[oaicite:4]{index=4}
        // This line saves the string under the "scores" key
        localStorage.setItem("scores", text);
    }

    // This function appends a new score record into persistent storage
    function saveScoreToStorage(name, correct, total) {
        // This line reads the existing scores (or an empty array)
        const scores = getScoresFromStorage();
        // This line constructs a score object with a timestamp for ordering if needed
        const record = { name: name, correct: correct, total: total, ts: Date.now() };
        // This line appends the new record
        scores.push(record);
        // This line writes the updated array back to storage
        setScoresInStorage(scores);
    }

    // This function renders the entire scoreboard from localStorage
    function displayScores() {
        // This line selects the table body to insert rows
        const tbody = document.querySelector("#score-table tbody");
        // This line clears existing rows to avoid duplication
        tbody.innerHTML = "";
        // This line reads all saved scores
        const scores = getScoresFromStorage();
        // This line loops over each score record and renders a row
        scores.forEach(function (s) {
            // This line creates a table row for the record
            const tr = document.createElement("tr");
            // This line creates a cell for the player's name
            const tdName = document.createElement("td");
            // This line sets the player's name text
            tdName.textContent = s.name;
            // This line creates a cell for the formatted score
            const tdScore = document.createElement("td");
            // This line sets the score text as "correct/total"
            tdScore.textContent = s.correct + "/" + s.total;
            // This line appends the name cell to the row
            tr.appendChild(tdName);
            // This line appends the score cell to the row
            tr.appendChild(tdScore);
            // This line appends the completed row to the table body
            tbody.appendChild(tr);
        });
    }

    // ---------- Username helper and data-clear features ----------

    // This function pre-fills the username input from localStorage, if available
    function checkUsername() {
        // This line reads the stored "username" value (if any)
        const savedName = localStorage.getItem("username");
        // This line selects the username input element
        const usernameInput = document.getElementById("username");
        // This line writes the stored name into the input if present
        if (savedName) {
            usernameInput.value = savedName;
        }
    }

    // This function clears scores and saved username (Clear All Data action)
    function clearAllData() {
        // This line asks for confirmation before wiping all saved data
        const ok = confirm("Clear ALL saved data (scores and saved name)? This cannot be undone.");
        // This line aborts if the user cancels
        if (!ok) return;
        // This line removes the persisted scores list
        localStorage.removeItem("scores");
        // This line removes the saved username
        localStorage.removeItem("username");
        // This line clears the username input in the UI
        document.getElementById("username").value = "";
        // This line refreshes the scoreboard to show it is empty
        displayScores();
        // This line alerts the user that data has been cleared
        alert("All saved data has been cleared.");
    }

    // This function clears only saved scores (retained from Commit 5)
    function clearScores() {
        // This line confirms the action to prevent accidental deletion
        const ok = confirm("Clear all saved scores? This cannot be undone.");
        // This line stops if the user cancels
        if (!ok) return;
        // This line sets scores to an empty array in storage
        setScoresInStorage([]);
        // This line re-renders the now-empty scoreboard
        displayScores();
    }

    // This JSDoc explains the New Player behavior
    /**
     * Begins a new player session by resetting inputs, re-enabling submit,
     * fetching fresh questions, and focusing the name field.
     */
    // This function resets the UI for a new round without clearing saved scores
    function newPlayer() {
        // This line clears the username input so a different name can be entered
        document.getElementById("username").value = "";
        // This line re-enables the submit button for the next attempt
        document.getElementById("submit-game").disabled = false;
        // This line hides the New Player button until after the next submission
        newPlayerButton.classList.add("hidden");
        // This line clears out any previously rendered questions
        questionContainer.innerHTML = "";
        // This line shows the loader while fetching new questions
        showLoading(true);
        // This line fetches a fresh set of questions to start a new round
        fetchQuestions();
        // This line focuses the username field for convenience
        document.getElementById("username").focus();
        // This line scrolls to the top so the form is fully visible
        window.scrollTo(0, 0);
    }
});
// This line ends the DOMContentLoaded setup wrapper
