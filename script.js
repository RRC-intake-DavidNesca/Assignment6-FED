/**
 * Initializes the Trivia Game, fetches questions, scores answers,
 * and persists scoreboard entries using localStorage.
 */

// Register a DOMContentLoaded handler so code runs after the HTML is parsed
document.addEventListener("DOMContentLoaded", function () {
    // Cache the trivia form element for submit handling
    const form = document.getElementById("trivia-form");
    // Cache the container that will hold all rendered questions
    const questionContainer = document.getElementById("question-container");
    // Cache the New Player button for resetting between rounds
    const newPlayerButton = document.getElementById("new-player");

    // Begin initialization for the page load
    // Leave the username check commented until a later commit introduces it
    // checkUsername(); Uncomment once completed
    // Fetch a fresh set of questions to display to the player
    fetchQuestions();
    // Render any previously saved scores from localStorage at startup
    displayScores();

    // Document the purpose of this function for maintainability
    /**
     * Fetches trivia questions from the API and displays them.
     */
    // Define the function that retrieves questions and manages the loader state
    function fetchQuestions() {
        // Show the loading skeleton while the network request is in progress
        showLoading(true); // Show loading state

        // Request 10 multiple-choice questions from the Open Trivia DB API
        fetch("https://opentdb.com/api.php?amount=10&type=multiple")
            // Convert the HTTP response into parsed JSON data
            .then((response) => response.json())
            // When JSON arrives, render questions and hide the loader
            .then((data) => {
                // Insert the returned questions into the DOM
                displayQuestions(data.results);
                // Hide the skeleton loader now that content is ready
                showLoading(false); // Hide loading state
            })
            // Gracefully handle network or parsing errors
            .catch((error) => {
                // Log the error for debugging purposes
                console.error("Error fetching questions:", error);
                // Ensure the loader is hidden even if an error occurs
                showLoading(false); // Hide loading state on error
            });
    }

    // Explain why this toggler exists and how it is used
    /**
     * Toggles the display of the loading state and question container.
     *
     * @param {boolean} isLoading - Whether the loading state should be shown.
     */
    // Define a helper that switches visibility between loader and questions
    function showLoading(isLoading) {
        // Select the loading skeleton container element
        const loadingEl = document.getElementById("loading-container");
        // Select the question container element
        const questionsEl = document.getElementById("question-container");
        // If we are loading, show the loader and hide questions
        if (isLoading) {
            // Remove 'hidden' to display the loader (per DOM/classList patterns) :contentReference[oaicite:3]{index=3}
            loadingEl.classList.remove("hidden");
            // Add 'hidden' so questions are not visible yet
            questionsEl.classList.add("hidden");
        } else {
            // Add 'hidden' to hide the loader
            loadingEl.classList.add("hidden");
            // Remove 'hidden' so questions are displayed
            questionsEl.classList.remove("hidden");
        }
    }

    // Describe how we render fetched questions
    /**
     * Displays fetched trivia questions.
     * @param {Object[]} questions - Array of trivia questions.
     */
    // Define the renderer that creates DOM blocks for each question
    function displayQuestions(questions) {
        // Clear any existing content so we can render a fresh set
        questionContainer.innerHTML = ""; // Clear existing questions
        // Loop through each question to build its markup
        questions.forEach((question, index) => {
            // Create a container element for a single question and its answers
            const questionDiv = document.createElement("div");
            // Build the inner markup: prompt plus a block of answer radios
            questionDiv.innerHTML = `
                <p>${question.question}</p>
                ${createAnswerOptions(
                    question.correct_answer,
                    question.incorrect_answers,
                    index
                )}
            `;
            // Append the question block to the question container
            questionContainer.appendChild(questionDiv);
        });
    }

    // Document how we generate answer options
    /**
     * Creates HTML for answer options.
     * @param {string} correctAnswer - The correct answer for the question.
     * @param {string[]} incorrectAnswers - Array of incorrect answers.
     * @param {number} questionIndex - The index of the current question.
     * @returns {string} HTML string of answer options.
     */
    // Define a helper that merges/shuffles answers and returns labeled radio inputs
    function createAnswerOptions(
        correctAnswer,
        incorrectAnswers,
        questionIndex
    ) {
        // Merge correct and incorrect arrays, then shuffle the combined list
        const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
            () => Math.random() - 0.5
        );
        // Map each answer to a <label><input type="radio">…</label>, tagging correct choices
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
            // Join the array of strings into a single HTML snippet
            .join("");
    }

    // Attach the submit handler for finishing the game
    form.addEventListener("submit", handleFormSubmit);
    // Attach the New Player handler to reset the round
    newPlayerButton.addEventListener("click", newPlayer);

    // Describe the purpose of this handler in a JSDoc block
    /**
     * Handles the trivia form submission.
     * @param {Event} event - The submit event.
     */
    // Define the handler that computes score, saves it, and updates the UI
    function handleFormSubmit(event) {
        // Prevent full-page reload so we can process the form with JavaScript
        event.preventDefault();
        // Count how many question blocks are currently displayed
        const totalQuestions = document.querySelectorAll(
            "#question-container > div"
        ).length;
        // Start a counter to track the number of correct answers
        let score = 0;
        // Loop through each question index to check the selected answer
        for (let i = 0; i < totalQuestions; i++) {
            // Build a CSS selector that finds the checked radio in this group
            const selector = `input[name="answer${i}"]:checked`;
            // Query the DOM for the selected input (if any) for this question
            const selected = document.querySelector(selector);
            // If a selection exists and is marked correct, increment the score
            if (selected && selected.dataset && selected.dataset.correct === "true") {
                // Add one point for a correct answer
                score++;
            }
        }
        // Get a reference to the username input field
        const nameInput = document.getElementById("username");
        // Use the trimmed name or a fallback of "Anonymous" if missing
        const playerName = (nameInput.value || "").trim() || "Anonymous";

        // Append the immediate result row (kept from prior commit for continuity)
        // Find the table body where we will add the new row
        const tbody = document.querySelector("#score-table tbody");
        // Create a new table row element for the result
        const row = document.createElement("tr");
        // Create a cell for the player's name
        const nameCell = document.createElement("td");
        // Put the player's name into the name cell
        nameCell.textContent = playerName;
        // Create a cell for the score value
        const scoreCell = document.createElement("td");
        // Format the score as "correct/total"
        scoreCell.textContent = `${score}/${totalQuestions}`;
        // Append the name cell into the row
        row.appendChild(nameCell);
        // Append the score cell into the row
        row.appendChild(scoreCell);
        // Append the row into the table body
        tbody.appendChild(row);

        // Persist the score to localStorage so it survives page reloads (Module 6 topic)
        saveScoreToStorage(playerName, score, totalQuestions);
        // Re-render the scoreboard from storage so it reflects the full persisted list
        displayScores();

        // Reveal the New Player button so the next round can start
        newPlayerButton.classList.remove("hidden");
        // Disable the submit button to prevent duplicate submissions for the same attempt
        document.getElementById("submit-game").disabled = true;
    }

    // ---- Commit 4 additions below: storage helpers and scoreboard rendering ----

    // Add a helper that safely reads the stored scores array from localStorage
    function getScoresFromStorage() {
        // Retrieve the JSON string for scores from localStorage
        const raw = localStorage.getItem("scores");
        // If nothing is stored, return an empty array
        if (!raw) {
            // Return an empty list because there are no scores yet
            return [];
        }
        // Try to parse the stored JSON safely in case it was corrupted
        try {
            // Convert the JSON text into a JavaScript array of score objects
            return JSON.parse(raw);
        } catch (e) {
            // Log a warning so corruption is visible in the console (per Debugging notes)
            console.error("Invalid scores in storage:", e); // :contentReference[oaicite:4]{index=4}
            // Return an empty array to keep the app running
            return [];
        }
    }

    // Add a helper that writes the provided scores array back to localStorage
    function setScoresInStorage(scoresArray) {
        // Convert the array of score objects into a JSON string
        const text = JSON.stringify(scoresArray); // :contentReference[oaicite:5]{index=5}
        // Save the JSON string into localStorage under the "scores" key
        localStorage.setItem("scores", text);
    }

    // Add a helper that appends one new score object into persistent storage
    function saveScoreToStorage(name, correct, total) {
        // Read the current list from storage (or an empty array)
        const scores = getScoresFromStorage();
        // Create a new score record object with the player name and result
        const record = { name: name, correct: correct, total: total, ts: Date.now() };
        // Append the new record to the in-memory array
        scores.push(record);
        // Write the updated array back to storage
        setScoresInStorage(scores);
    }

    // Implement a renderer that draws the scoreboard entirely from localStorage
    function displayScores() {
        // Select the table body where rows will be displayed
        const tbody = document.querySelector("#score-table tbody");
        // Clear any existing rows to avoid duplicates
        tbody.innerHTML = "";
        // Read the array of saved scores from storage
        const scores = getScoresFromStorage();
        // Loop through each saved score and render a table row
        scores.forEach(function (s) {
            // Create a table row element for this saved record
            const tr = document.createElement("tr");
            // Create a cell for the player's name
            const tdName = document.createElement("td");
            // Put the player's name into the first cell
            tdName.textContent = s.name;
            // Create a cell for the formatted score
            const tdScore = document.createElement("td");
            // Set the score text as "correct/total"
            tdScore.textContent = s.correct + "/" + s.total;
            // Append the name cell to the row
            tr.appendChild(tdName);
            // Append the score cell to the row
            tr.appendChild(tdScore);
            // Append the completed row to the tbody
            tbody.appendChild(tr);
        });
    }

    // Keep the New Player flow from the previous commit
    /**
     * Begins a new player session by resetting UI state and fetching fresh questions.
     */
    // Define the handler that resets UI for a new round (does not clear persisted scores)
    function newPlayer() {
        // Get a reference to the username input to clear it
        const usernameInput = document.getElementById("username");
        // Clear any previously entered name
        usernameInput.value = "";
        // Re-enable the submit button so the next submission is allowed
        document.getElementById("submit-game").disabled = false;
        // Hide the New Player button again until after the next submission
        newPlayerButton.classList.add("hidden");
        // Clear the existing questions so the next set won’t stack with the old ones
        questionContainer.innerHTML = "";
        // Show the loader while fetching new questions
        showLoading(true);
        // Fetch a fresh set of questions to start a new round
        fetchQuestions();
        // Put keyboard focus back into the name field for convenience
        usernameInput.focus();
    }
});
// End of DOMContentLoaded handler
