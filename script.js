// Provide a high-level description of the script’s purpose for documentation
/**
 * Initializes the Trivia Game when the DOM is fully loaded.
 */

// Attach an event listener that runs after the initial HTML document has been fully loaded and parsed
document.addEventListener("DOMContentLoaded", function () {
    // Cache a reference to the form element so we can handle submissions
    const form = document.getElementById("trivia-form");
    // Cache a reference to the container where questions will be injected
    const questionContainer = document.getElementById("question-container");
    // Cache a reference to the button used to start a new player session
    const newPlayerButton = document.getElementById("new-player");

    // Initialize the game by preparing UI and data
    // Leave username check commented until the feature is implemented as part of a later commit
    // checkUsername(); Uncomment once completed
    // Trigger a fetch to load trivia questions from the API
    fetchQuestions();
    // Populate the scores table (minimal stub for now to avoid runtime errors)
    displayScores();

    // Define a function that retrieves trivia questions from an external API and renders them to the page
    function fetchQuestions() {
        // Show the loading state while the API request is in progress
        showLoading(true); // Show loading state

        // Use the Fetch API to request 10 multiple-choice questions
        fetch("https://opentdb.com/api.php?amount=10&type=multiple")
            // Convert the response into JSON so we can access the results array
            .then((response) => response.json())
            // Handle the parsed JSON data and display the questions
            .then((data) => {
                // Render the returned questions into the question container
                displayQuestions(data.results);
                // Hide the loading state because data is ready
                showLoading(false); // Hide loading state
            })
            // Catch any error from the network request or JSON parsing
            .catch((error) => {
                // Log the error so it is easier to debug
                console.error("Error fetching questions:", error);
                // Hide the loading state if an error occurs
                showLoading(false); // Hide loading state on error
            });
    }

    // Define a function that toggles the visibility of the loader and question container
    /**
     * Toggles the display of the loading state and question container.
     *
     * @param {boolean} isLoading - Indicates whether the loading state should be shown.
     */
    function showLoading(isLoading) {
        // Get a reference to the loading container element
        const loadingEl = document.getElementById("loading-container");
        // Get a reference to the question container element
        const questionsEl = document.getElementById("question-container");
        // If we are currently loading, show the skeleton and hide the questions
        if (isLoading) {
            // Ensure the loading skeleton is visible by removing the 'hidden' class
            loadingEl.classList.remove("hidden");
            // Ensure the questions are hidden during loading by adding the 'hidden' class
            questionsEl.classList.add("hidden");
        } else {
            // Hide the loading skeleton by adding the 'hidden' class
            loadingEl.classList.add("hidden");
            // Reveal the questions by removing the 'hidden' class
            questionsEl.classList.remove("hidden");
        }
    }

    // Define a function that renders fetched questions into the DOM
    /**
     * Displays fetched trivia questions.
     * @param {Object[]} questions - Array of trivia questions.
     */
    function displayQuestions(questions) {
        // Clear any previously rendered questions so we start fresh
        questionContainer.innerHTML = ""; // Clear existing questions
        // Loop over the array of question objects and render each one
        questions.forEach((question, index) => {
            // Create a container for the current question block
            const questionDiv = document.createElement("div");
            // Build the inner HTML for the question text and its answer options
            questionDiv.innerHTML = `
                <p>${question.question}</p>
                ${createAnswerOptions(
                    question.correct_answer,
                    question.incorrect_answers,
                    index
                )}
            `;
            // Append the question block to the main question container in the form
            questionContainer.appendChild(questionDiv);
        });
    }

    // Define a helper that produces the markup for multiple-choice answers
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
        // Combine the correct answer and incorrect answers into one array and shuffle them
        const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
            () => Math.random() - 0.5
        );
        // Return a string of label+radio inputs, marking the correct answer with a data attribute
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
            .join("");
    }

    // Attach an event listener that will handle the form submission (finish game)
    form.addEventListener("submit", handleFormSubmit);
    // Attach an event listener that will start a new player session when clicked
    newPlayerButton.addEventListener("click", newPlayer);

    // Define the handler that runs when the player submits the form
    /**
     * Handles the trivia form submission.
     * @param {Event} event - The submit event.
     */
    function handleFormSubmit(event) {
        // Prevent the browser from performing its default form submission (page reload)
        event.preventDefault();
        // Placeholder: we will add form submission logic, scoring, and storage in later commits
        //... form submission logic including setting cookies and calculating score
    }

    // Provide a minimal, safe placeholder function that renders the scores section (prevents ReferenceError)
    function displayScores() {
        // Select the table body where score rows would go
        const tbody = document.querySelector("#score-table tbody");
        // Ensure the table body is clear; actual rendering logic will be added in a later commit
        tbody.innerHTML = "";
    }

    // Provide a minimal placeholder for starting a new player; will be fully implemented in a later commit
    function newPlayer() {
        // For now, simply clear the username field as a harmless, visible effect
        const usernameInput = document.getElementById("username");
        // Set the input to an empty string so the user can type a new name
        usernameInput.value = "";
    }
});
// End of DOMContentLoaded handler
