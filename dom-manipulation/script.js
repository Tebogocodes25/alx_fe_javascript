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
const exportQuotesButton = document.getElementById('exportQuotes');
const importFileInput = document.getElementById('importFile');
const categoryFilterSelect = document.getElementById('categoryFilter'); // NEW: Reference to the filter dropdown


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

// NEW: Function to save the selected category to Local Storage
function saveSelectedCategory(category) {
    localStorage.setItem('selectedCategory', category);
}

// NEW: Function to load the selected category from Local Storage
function loadSelectedCategory() {
    return localStorage.getItem('selectedCategory') || 'all'; // Default to 'all'
}


// --- Core DOM Manipulation Functions ---

// Function to display a random quote (showRandomQuote)
function showRandomQuote() {
    // Determine which quotes to pick from based on current filter
    const selectedCategory = categoryFilterSelect.value;
    const filteredQuotes = selectedCategory === 'all'
        ? quotes
        : quotes.filter(quote => quote.category === selectedCategory);

    // Clear previous quotes
    quoteDisplay.innerHTML = '';

    if (filteredQuotes.length === 0) {
        quoteDisplay.textContent = `No quotes found for category "${selectedCategory}".`;
        // Optionally, display a random quote from ALL quotes if filtered is empty
        // if (quotes.length > 0) {
        //     const randomIndex = Math.floor(Math.random() * quotes.length);
        //     const randomQuote = quotes[randomIndex];
        //     quoteDisplay.textContent = `No quotes in this category. Here's one: "${randomQuote.text}" (${randomQuote.category})`;
        // }
        return;
    }

    // Get a random index from the FILTERED quotes
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];

    // Save this quote to session storage
    saveLastViewedQuote(randomQuote);

    // Create new elements to display the quote
    const quoteParagraph = document.createElement('p');
    const categorySpan = document.createElement('span');

    // Set their content
    quoteParagraph.textContent = `"${randomQuote.text}"`;
    categorySpan.textContent = `Category: ${randomQuote.category}`;
    categorySpan.style.fontStyle = 'italic';
    categorySpan.style.display = 'block';

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

    // NEW: Update categories in dropdown after adding a new quote/category
    populateCategories();
    // Set the filter to 'all' or the newly added category
    categoryFilterSelect.value = newQuoteCategory; // Or 'all' if you prefer
    saveSelectedCategory(newQuoteCategory); // Save the new category as selected

    // Clear the input fields
    newQuoteTextInput.value = '';
    newQuoteCategoryInput.value = '';

    alert("Quote added successfully!");

    // Display a quote, ensuring it reflects the new addition/filter
    filterQuotes(); // This will re-evaluate based on the potentially new filter
}

// --- NEW: Category Filtering Logic ---

// Function to populate categories dynamically (populateCategories)
function populateCategories() {
    // Get unique categories from the quotes array
    const categories = ['all', ...new Set(quotes.map(quote => quote.category))];

    // Clear existing options except "All Categories"
    categoryFilterSelect.innerHTML = '<option value="all">All Categories</option>';

    // Add new options
    categories.forEach(category => {
        if (category !== 'all') { // Skip 'all' as it's already there
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilterSelect.appendChild(option);
        }
    });

    // Restore the last selected category from local storage
    const lastSelectedCategory = loadSelectedCategory();
    if (categories.includes(lastSelectedCategory)) { // Ensure the category still exists
        categoryFilterSelect.value = lastSelectedCategory;
    } else {
        categoryFilterSelect.value = 'all'; // Default if the saved category no longer exists
        saveSelectedCategory('all');
    }
}

// Function to filter quotes based on selected category (filterQuotes)
function filterQuotes() {
    const selectedCategory = categoryFilterSelect.value;
    saveSelectedCategory(selectedCategory); // Save the selected category to local storage

    // Simply call showRandomQuote, which now handles filtering
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to import quotes from JSON file
function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const importedQuotes = JSON.parse(event.target.result);
            quotes = importedQuotes; // Replacing existing quotes
            saveQuotes(); // Save imported quotes to local storage
            populateCategories(); // NEW: Update categories after import
            alert("Quotes imported successfully!");
            filterQuotes(); // Display a quote from the imported list, applying current filter
        } catch (e) {
            alert("Error parsing JSON file. Please ensure it's a valid JSON format.");
            console.error("JSON parsing error:", e);
        }
    };
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
    populateCategories(); // NEW: Populate categories after quotes are loaded
    
    // Restore the last viewed quote from session storage, if applicable and matches current filter
    const lastViewed = loadLastViewedQuote();
    const selectedCategoryOnLoad = loadSelectedCategory(); // Get selected category for initial filtering

    // Filter quotes based on the category loaded from local storage
    const filteredQuotesForInit = selectedCategoryOnLoad === 'all'
        ? quotes
        : quotes.filter(quote => quote.category === selectedCategoryOnLoad);

    if (lastViewed && filteredQuotesForInit.some(q => q.text === lastViewed.text && q.category === lastViewed.category)) {
        // If last viewed quote exists and is still in the list filtered by the last category, display it
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
        // Otherwise, show a random quote from the initially filtered set
        showRandomQuote();
    }

    createAddQuoteForm(); // Dynamically create and display the "Add Quote" form
});
