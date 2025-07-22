// 1. Manage an array of quote objects
const quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Innovation" },
    { text: "Strive not to be a success, but rather to be of value.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
    { text: "The mind is everything. What you think you become.", category: "Philosophy" }
];

// Get references to key DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote'); // The "Show New Quotes" button
const addQuoteFormContainer = document.getElementById('addQuoteFormContainer'); // Container for the dynamically created form

// Function to display a random quote - named 'showRandomQuote' as per your prompt
function showRandomQuote() {
    // Clear previous quotes
    quoteDisplay.innerHTML = '';

    // Handle case where there are no quotes
    if (quotes.length === 0) {
        quoteDisplay.textContent = "No quotes available. Add some!";
        return;
    }

    // Get a random index
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];

    // Create new elements to display the quote
    const quoteParagraph = document.createElement('p');
    const categorySpan = document.createElement('span');

    // Set their content
    quoteParagraph.textContent = `"${randomQuote.text}"`;
    categorySpan.textContent = `Category: ${randomQuote.category}`;
    categorySpan.style.fontStyle = 'italic';
    categorySpan.style.display = 'block'; // Make category appear on a new line

    // Append them to the quoteDisplay div
    quoteDisplay.appendChild(quoteParagraph);
    quoteDisplay.appendChild(categorySpan);
}

// Function to dynamically create and add the "Add Quote" form - named 'createAddQuoteForm' as per your prompt
function createAddQuoteForm() {
    // Clear any existing content in the container
    addQuoteFormContainer.innerHTML = '';

    // Create the elements for the form
    const formDiv = document.createElement('div');
    const heading = document.createElement('h2');
    const quoteTextInput = document.createElement('input');
    const categoryTextInput = document.createElement('input');
    const addButton = document.createElement('button');

    // Set attributes and content
    heading.textContent = "Add New Quote";

    quoteTextInput.type = "text";
    quoteTextInput.id = "newQuoteText"; // Keep IDs for easy access
    quoteTextInput.placeholder = "Enter a new quote";

    categoryTextInput.type = "text";
    categoryTextInput.id = "newQuoteCategory"; // Keep IDs for easy access
    categoryTextInput.placeholder = "Enter quote category";

    addButton.textContent = "Add Quote";
    addButton.onclick = addQuote; // Attach the addQuote function to the button's click event

    // Append elements to the formDiv
    formDiv.appendChild(heading);
    formDiv.appendChild(quoteTextInput);
    formDiv.appendChild(categoryTextInput);
    formDiv.appendChild(addButton);

    // Append the entire formDiv to the container in the HTML
    addQuoteFormContainer.appendChild(formDiv);
}

// Function to add a new quote (remains largely the same)
function addQuote() {
    // Get inputs directly by their IDs
    const newQuoteTextInput = document.getElementById('newQuoteText');
    const newQuoteCategoryInput = document.getElementById('newQuoteCategory');

    const newQuoteText = newQuoteTextInput.value.trim();
    const newQuoteCategory = newQuoteCategoryInput.value.trim();

    // Basic validation
    if (newQuoteText === "" || newQuoteCategory === "") {
        alert("Please enter both quote text and category.");
        return;
    }

    // Create the new quote object
    const newQuote = {
        text: newQuoteText,
        category: newQuoteCategory
    };

    // Add the new quote to our quotes array
    quotes.push(newQuote);

    // Clear the input fields after adding
    newQuoteTextInput.value = '';
    newQuoteCategoryInput.value = '';

    // Give feedback to the user
    alert("Quote added successfully!");

    // Optional: After adding a quote, you might want to show a random one,
    // which could even be the new one.
    // showRandomQuote();
}

// Event Listeners:
// 1. Attach showRandomQuote to the "Show New Quotes" button click
newQuoteButton.addEventListener('click', showRandomQuote);

// 2. Initial setup when the page loads
document.addEventListener('DOMContentLoaded', () => {
    showRandomQuote();       // Display an initial random quote
    createAddQuoteForm();    // Dynamically create and display the "Add Quote" form
});