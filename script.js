// Add a documentation block describing the main purpose of this script
/**
 * Initializes the Trivia Game when the DOM is fully loaded.
 */

// Attach a listener so code runs after the initial HTML is parsed
document.addEventListener("DOMContentLoaded", function () {
    // Grab a reference to the trivia form for submission handling
    const form = document.getElementById("trivia-form");
    // Grab the container where questions will be inserted dynamically
    const questionContainer = document.getElementById("question-container");
    // Grab a reference to the "New Player" button for later use
    const newPlayerButton = document.getElementById("new-player");

    // Initialize the game flow on load
    // Leave username check commented until the feature is implemented later
    // checkUsername(); Uncomment once completed
    // Call the function that loads questions from the API
    fetchQuestions();
    // Call a placeholder (still a stub) so the page loads without errors; full logic comes later
    displayScores();

    // Provide a function that fetches 10 multiple-choice trivia questions
    /**
     * Fetches trivia questions from the API and displays them.
     */
    function fetchQuestions() {
        // Show the loading skeleton while the network request is in progress
        showLoading(true); // Show loading state

        // Request 10 multiple-choice questions from the Open Trivia DB API
        fetch("https://opentdb.com/api.php?amount=10&type=multiple")
            // Convert the network response into JSON data
            .then((response) => response.json())
            // When data arrives successfully, render questions and hide the loader
            .then((data) => {
                // Insert the questions into the DOM
                displayQuestions(data.results);
                // Hide the loading skeleton now that content is ready
                showLoading(false); // Hide loading state
            })
            // Catch and report any networking or parsing errors
            .catch((error) => {
                // Log the error for debugging purposes
                console.error("Error fetching questions:", error);
                // Ensure the loading skeleton hides even if an error occurs
                showLoading(false); // Hide loading state on error
            });
    }

    // Provide a utility that manages visibility for the loading and question areas
    /**
     * Toggles the display of the loading state and question container.
     *
     * @param {boolean} isLoading - Indicates whether the loading state should be shown.
     */
    function showLoading(isLoading) {
        // Get the loading container element whose visibility we are toggling
        const loadingEl = document.getElementById("loading-container");
        // Get the question container element whose visibility we are toggling
        const questionsEl = document.getElementById("question-container");
        // When loading, show the loader and hide the questions; otherwise, do the reverse
        if (isLoading) {
            // Remove the 'hidden' class so the loader becomes visible (per modules: classList.add/remove) :contentReference[oaicite:3]{index=3}
            loadingEl.classList.remove("hidden");
            // Add the 'hidden' class so questions are not visible yet
            questionsEl.classList.add("hidden");
        } else {
            // Add the 'hidden' class so the loader is hidden
            loadingEl.classList.add("hidden");
            // Remove the 'hidden' class so questions are visible
            questionsEl.classList.remove("hidden");
        }
    }

    // Provide a renderer that converts fetched question data into HTML blocks
    /**
     * Displays fetched trivia questions.
     * @param {Object[]} questions - Array of trivia questions.
     */
    function displayQuestions(questions) {
        // Clear any existing content so we can insert a fresh set of questions
        questionContainer.innerHTML = ""; // Clear existing questions
        // Loop over each question and its index to build markup
        questions.forEach((question, index) => {
            // Create a container element for a single question and its options
            const questionDiv = document.createElement("div");
            // Define the HTML structure for the question prompt and its answer choices
            questionDiv.innerHTML = `
                <p>${question.question}</p>
                ${createAnswerOptions(
                    question.correct_answer,
                    question.incorrect_answers,
                    index
                )}
            `;
            // Insert the question block into the question container in the DOM
            questionContainer.appendChild(questionDiv);
        });
    }

    // Provide a helper that builds the radio inputs for a single question’s options
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
        // Combine the correct answer with the incorrect ones and shuffle order randomly
        const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
            () => Math.random() - 0.5
        );
        // Convert each answer string into a labeled radio input (mark correct using a data attribute)
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
            // Join the array of option strings into one HTML string
            .join("");
    }

    // Attach a submit handler to the form so we can process the game when the user finishes
    // (This uses the DOM events pattern from your modules.) :contentReference[oaicite:4]{index=4}
    form.addEventListener("submit", handleFormSubmit);
    // Attach a click handler for starting a new player flow (defined below as a stub for now)
    newPlayerButton.addEventListener("click", newPlayer);

    // Provide a function that now computes score and appends it to the score table
    /**
     * Handles the trivia form submission.
     * @param {Event} event - The submit event.
     */
    function handleFormSubmit(event) {
        // Prevent the page from reloading so we can handle scoring in JavaScript
        event.preventDefault();
        // Compute how many question blocks are currently rendered
        const totalQuestions = document.querySelectorAll(
            "#question-container > div"
        ).length;
        // Start a counter to track the number of correct answers
        let score = 0;
        // Loop through each question index to find the selected answer
        for (let i = 0; i < totalQuestions; i++) {
            // Build a selector that targets the checked radio for this question
            const selector = `input[name="answer${i}"]:checked`;
            // Find the checked input (if any) for the current question
            const selected = document.querySelector(selector);
            // If an option is selected and it carries the correct-answer data attribute, increase the score
            if (selected && selected.dataset && selected.dataset.correct === "true") {
                // Increment the score for a correct selection
                score++;
            }
        }
        // Read the player name from the username input field
        const nameInput = document.getElementById("username");
        // Use the trimmed value or a default of "Anonymous" if nothing was entered
        const playerName = (nameInput.value || "").trim() || "Anonymous";
        // Locate the tbody element where we will insert a new score row
        const tbody = document.querySelector("#score-table tbody");
        // Create a new table row element for this player's result
        const row = document.createElement("tr");
        // Create a cell for the player name
        const nameCell = document.createElement("td");
        // Set the text content of the name cell to the player's name
        nameCell.textContent = playerName;
        // Create a cell for the player score
        const scoreCell = document.createElement("td");
        // Set the text to "correct/total" so the user sees performance
        scoreCell.textContent = `${score}/${totalQuestions}`;
        // Append the name cell to the new table row
        row.appendChild(nameCell);
        // Append the score cell to the new table row
        row.appendChild(scoreCell);
        // Append the completed row to the score table body
        tbody.appendChild(row);
        // Reveal the "New Player" button so another attempt can be made
        newPlayerButton.classList.remove("hidden");
        // Disable the submit button to prevent duplicate submissions for the same attempt
        document.getElementById("submit-game").disabled = true;
    }

    // Add a non-breaking placeholder for rendering the saved scores so initialization does not fail
    /**
     * Displays saved scores in the score table (placeholder for now).
     * This stub prevents runtime errors; full implementation will come in later commits.
     */
    function displayScores() {
        // Intentionally left minimal in Commit 2: persistence and rendering will come later
        // (Keeping this stub ensures the app initializes without errors.)
    }

    // Add a non-breaking placeholder for the "New Player" action so the click listener works
    /**
     * Begins a new player session (placeholder for now).
     * This stub will be expanded to reset stored state and UI in a later commit.
     */
    function newPlayer() {
        // For now, simply clear the username input so a different name can be entered
        document.getElementById("username").value = "";
        // We’ll add full reset behavior (including clearing saved state) in a later commit
    }
});
// End of DOMContentLoaded handler
