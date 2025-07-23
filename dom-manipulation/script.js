// Initial quotes array
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Innovation" },
    { text: "Strive not to be a success, but rather to be of value.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
    { text: "The mind is everything. What you think you become.", category: "Philosophy" }
];

// Get references to key DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const addQuoteFormContainer = document.getElementById('addQuoteFormContainer');
const exportQuotesButton = document.getElementById('exportQuotes'); // Added for export functionality
const importFileInput = document.getElementById('importFile'); // Added for import functionality

// --- Helper Functions for Web Storage ---

// Function to save quotes to Local Storage
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Function to load quotes from Local Storage
function loadQuotes() {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
    } else {
        // If no quotes in local storage, save the initial ones
        saveQuotes();
    }
}

// Function to save the last viewed quote to Session Storage
function saveLastViewedQuote(quote) {
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
}

// Function to load the last viewed quote from Session Storage
function loadLastViewedQuote() {
    const lastQuote = sessionStorage.getItem('lastViewedQuote');
    if (lastQuote) {
        return JSON.parse(lastQuote);
    }
    return null;
}


// --- Core DOM Manipulation Functions ---

// Function to display a random quote (showRandomQuote)
function showRandomQuote() {
    // Clear previous quotes
    quoteDisplay.innerHTML = '';

    if (quotes.length === 0) {
        quoteDisplay.textContent = "No quotes available. Add some!";
        return;
    }

    // Get a random index
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];

    // Save this quote to session storage
    saveLastViewedQuote(randomQuote);

    // Create new elements to display the quote
    const quoteParagraph = document.createElement('p');
    const categorySpan = document.createElement('span');

    // Set their content
    quoteParagraph.textContent = `"${randomQuote.text}"`;
    categorySpan.textContent = `Category: ${randomQuote.category}`;
    categorySpan.style.fontStyle = 'italic';
    categorySpan.style.display = 'block'; // Make category appear on a new line for better readability

    // Append them to the quoteDisplay div
    quoteDisplay.appendChild(quoteParagraph);
    quoteDisplay.appendChild(categorySpan);
}

// Function to dynamically create and add the "Add Quote" form (createAddQuoteForm)
function createAddQuoteForm() {
    addQuoteFormContainer.innerHTML = ''; // Clear any existing content

    const formDiv = document.createElement('div');
    const heading = document.createElement('h2');
    const quoteTextInput = document.createElement('input');
    const categoryTextInput = document.createElement('input');
    const addButton = document.createElement('button');

    // Set attributes and content
    heading.textContent = "Add New Quote";

    quoteTextInput.type = "text";
    quoteTextInput.id = "newQuoteText";
    quoteTextInput.placeholder = "Enter a new quote";

    categoryTextInput.type = "text";
    categoryTextInput.id = "newQuoteCategory";
    categoryTextInput.placeholder = "Enter quote category";

    addButton.textContent = "Add Quote";
    addButton.onclick = addQuote; // Attach the addQuote function directly

    // Append elements to the formDiv
    formDiv.appendChild(heading);
    formDiv.appendChild(quoteTextInput);
    formDiv.appendChild(categoryTextInput);
    formDiv.appendChild(addButton);

    // Append the entire formDiv to the container in the HTML
    addQuoteFormContainer.appendChild(formDiv);
}

// Function to add a new quote (addQuote)
function addQuote() {
    const newQuoteTextInput = document.getElementById('newQuoteText');
    const newQuoteCategoryInput = document.getElementById('newQuoteCategory');

    const newQuoteText = newQuoteTextInput.value.trim();
    const newQuoteCategory = newQuoteCategoryInput.value.trim();

    // Basic validation
    if (newQuoteText === "" || newQuoteCategory === "") {
        alert("Please enter both quote text and category.");
        return;
    }

    const newQuote = {
        text: newQuoteText,
        category: newQuoteCategory
    };

    quotes.push(newQuote);
    saveQuotes(); // Save to local storage after adding

    // Clear the input fields
    newQuoteTextInput.value = '';
    newQuoteCategoryInput.value = '';

    alert("Quote added successfully!");

    // You might want to update the displayed quote to include the new one
    showRandomQuote();
}

// --- JSON Import/Export Functions ---

// Function to export quotes to JSON file
function exportQuotesToJson() {
    const dataStr = JSON.stringify(quotes, null, 2); // null, 2 for pretty printing
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = "quotes.json"; // Filename
    document.body.appendChild(a); // Append to body to make it clickable
    a.click(); // Programmatically click the link
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url); // Release the URL object
}

// Function to import quotes from JSON file
function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const importedQuotes = JSON.parse(event.target.result);
            // Optional: You could merge or replace
            quotes = importedQuotes; // Replacing existing quotes
            saveQuotes(); // Save imported quotes to local storage
            alert("Quotes imported successfully!");
            showRandomQuote(); // Display a quote from the imported list
        } catch (e) {
            alert("Error parsing JSON file. Please ensure it's a valid JSON format.");
            console.error("JSON parsing error:", e);
        }
    };
    // Read the file as text
    fileReader.readAsText(event.target.files[0]);
}


// --- Event Listeners and Initial Setup ---

// 1. Attach showRandomQuote to the "Show New Quotes" button click
newQuoteButton.addEventListener('click', showRandomQuote);

// 2. Attach exportQuotesToJson to the "Export Quotes" button click
exportQuotesButton.addEventListener('click', exportQuotesToJson);

// 3. Initial setup when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadQuotes(); // Load quotes from local storage first
    const lastViewed = loadLastViewedQuote(); // Load last viewed from session storage

    if (lastViewed && quotes.some(q => q.text === lastViewed.text && q.category === lastViewed.category)) {
        // If last viewed quote exists and is still in our quotes list, display it
        // Clear display first
        quoteDisplay.innerHTML = '';
        const quoteParagraph = document.createElement('p');
        const categorySpan = document.createElement('span');
        quoteParagraph.textContent = `"${lastViewed.text}"`;
        categorySpan.textContent = `Category: ${lastViewed.category}`;
        categorySpan.style.fontStyle = 'italic';
        categorySpan.style.display = 'block';
        quoteDisplay.appendChild(quoteParagraph);
        quoteDisplay.appendChild(categorySpan);
    } else {
        showRandomQuote(); // Otherwise, display a random quote
    }

    createAddQuoteForm(); // Dynamically create and display the "Add Quote" form
});
