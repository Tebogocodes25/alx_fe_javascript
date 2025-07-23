// Initial quotes array - will be populated from localStorage or server
let quotes = [];

// API Endpoint for mock server
// It's often better to use '/quotes' if the mock API supported it, but 'posts' is a common fallback on JSONPlaceholder
const API_URL = 'https://jsonplaceholder.typicode.com/posts';

// Get references to key DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const addQuoteFormContainer = document.getElementById('addQuoteFormContainer');
const exportQuotesButton = document.getElementById('exportQuotes');
const importFileInput = document.getElementById('importFile');
const categoryFilterSelect = document.getElementById('categoryFilter');
const notificationDiv = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const resolveConflictBtn = document.getElementById('resolveConflictBtn');
const syncQuotesBtn = document.getElementById('syncQuotesBtn');

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
        // If no quotes exist, initialize with a default set or empty array
        quotes = [
            { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
            { text: "Innovation distinguishes between a leader and a follower.", category: "Innovation" },
            { text: "Strive not to be a success, but rather to be of value.", category: "Life" },
            { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
            { text: "The mind is everything. What you think you become.", category: "Philosophy" }
        ];
        saveQuotes(); // Save these initial quotes
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

// Function to save the selected category to Local Storage
function saveSelectedCategory(category) {
    localStorage.setItem('selectedCategory', category);
}

// Function to load the selected category from Local Storage
function loadSelectedCategory() {
    return localStorage.getItem('selectedCategory') || 'all';
}

// --- Notification and Conflict UI ---

// Function to show a notification
function showNotification(message, isConflict = false) {
    notificationMessage.textContent = message;
    notificationDiv.classList.add('show');
    if (isConflict) {
        resolveConflictBtn.style.display = 'inline-block';
        resolveConflictBtn.onclick = resolveConflictManually;
    } else {
        resolveConflictBtn.style.display = 'none';
    }
    // Hide notification after some time if not a conflict and no manual resolution is needed
    if (!isConflict) {
        setTimeout(() => {
            hideNotification();
        }, 5000); // Hide after 5 seconds
    }
}

// Function to hide the notification
function hideNotification() {
    notificationDiv.classList.remove('show');
    notificationMessage.textContent = '';
    resolveConflictBtn.style.display = 'none';
}

// --- Server Syncing Functions ---

// Helper to transform mock API data to our quote format
function transformApiDataToQuotes(data) {
    // Assuming JSONPlaceholder 'posts' have 'title' and 'body'
    // We'll use 'title' as text and assign a 'Server' category.
    return data.map(item => ({
        text: item.title,
        category: "Server" // Assigning a generic category for server-fetched items
    })).filter(quote => quote.text); // Filter out any items without a title
}

// Function to fetch quotes from the server (fetchQuotesFromServer)
async function fetchQuotesFromServer() {
    try {
        const response = await fetch(API_URL + '?_limit=10'); // Limit to 10 for manageable mock data
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const serverQuotesRaw = await response.json();
        const serverQuotes = transformApiDataToQuotes(serverQuotesRaw);
        return serverQuotes;
    } catch (error) {
        console.error("Error fetching quotes from server:", error);
        showNotification("Failed to fetch updates from server. See console.", false);
        return [];
    }
}

// Function to post a new quote to the server using a mock API (posting data to the server)
async function postQuoteToServer(quote) {
    try {
        // For JSONPlaceholder, usually `title` and `body` are used for post content.
        // We'll map our quote text to title and category to body.
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                title: quote.text,
                body: `Category: ${quote.category}`,
                userId: 1, // JSONPlaceholder often requires a userId
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        console.log("Quote successfully sent to mock server (won't persist):", responseData);
    } catch (error) {
        console.error("Error posting quote to server:", error);
        showNotification("Failed to send quote to server. Check console for details.", false);
    }
}

// Sync function with conflict resolution (syncQuotes)
// Server data takes precedence in case of discrepancies.
async function syncQuotes() {
    showNotification("Syncing with server...", false);
    const serverQuotes = await fetchQuotesFromServer(); // Fetch server data

    const localQuotesMap = new Map();
    quotes.forEach(q => localQuotesMap.set(q.text, q)); // Use Map for efficient lookup by text

    let newQuotesCount = 0;
    let updatedQuotesCount = 0;
    let conflictDetected = false;

    serverQuotes.forEach(serverQuote => {
        if (localQuotesMap.has(serverQuote.text)) {
            // Quote exists both locally and on server
            const localQuote = localQuotesMap.get(serverQuote.text);
            if (localQuote.category !== serverQuote.category) {
                // Conflict: same text, different categories. Server takes precedence.
                localQuote.category = serverQuote.category; // Update local category
                updatedQuotesCount++;
                conflictDetected = true;
            }
            // Mark as processed (or keep it from server if we are building a new array)
            // For server precedence, the server version effectively replaces the local one.
        } else {
            // Server quote does not exist locally, add it.
            quotes.push(serverQuote);
            newQuotesCount++;
        }
    });

    // Filter out any duplicates if the server had items identical to initial local items
    // (though our initial merge approach above minimizes this for text equality)
    // A robust unique check is better before saving
    const finalQuotesSet = new Set();
    quotes = quotes.filter(quote => {
        const uniqueKey = `${quote.text}-${quote.category}`; // Simple key for uniqueness
        if (!finalQuotesSet.has(uniqueKey)) {
            finalQuotesSet.add(uniqueKey);
            return true;
        }
        return false;
    });


    saveQuotes(); // Update local storage with server data and conflict resolution
    populateCategories(); // Re-populate dropdowns
    filterQuotes(); // Re-display quotes based on updated list

    let message = "Sync complete. ";
    if (newQuotesCount > 0) {
        message += `${newQuotesCount} new quotes from server added. `;
    }
    if (updatedQuotesCount > 0) {
        message += `${updatedQuotesCount} local quotes updated by server. `;
        conflictDetected = true; // Mark as conflict if any were updated by server precedence
    }
    if (newQuotesCount === 0 && updatedQuotesCount === 0) {
        message += "No new server data or updates.";
    }

    if (conflictDetected) {
        showNotification(message + " Some local changes were overwritten by server data. (Server takes precedence).", true); // UI elements for conflicts
    } else {
        showNotification(message);
    }
}

// Placeholder for manual conflict resolution (resolveConflictManually)
function resolveConflictManually() {
    alert("Manual conflict resolution: In a real application, a more sophisticated UI would appear here to let you choose which version of conflicting quotes to keep.");
    hideNotification(); // Hide notification after manual resolution initiated
}

// --- Core DOM Manipulation Functions ---

// Function to display a random quote (showRandomQuote)
function showRandomQuote() {
    const selectedCategory = categoryFilterSelect.value;
    const filteredQuotes = selectedCategory === 'all'
        ? quotes
        : quotes.filter(quote => quote.category === selectedCategory);

    quoteDisplay.innerHTML = '';

    if (filteredQuotes.length === 0) {
        quoteDisplay.textContent = `No quotes found for category "${selectedCategory}".`;
        return;
    }

    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];

    saveLastViewedQuote(randomQuote);

    const quoteParagraph = document.createElement('p');
    const categorySpan = document.createElement('span');

    quoteParagraph.textContent = `"${randomQuote.text}"`;
    categorySpan.textContent = `Category: ${randomQuote.category}`;
    categorySpan.style.fontStyle = 'italic';
    categorySpan.style.display = 'block';

    quoteDisplay.appendChild(quoteParagraph);
    quoteDisplay.appendChild(categorySpan);
}

// Function to dynamically create and add the "Add Quote" form (createAddQuoteForm)
function createAddQuoteForm() {
    addQuoteFormContainer.innerHTML = '';

    const formDiv = document.createElement('div');
    const heading = document.createElement('h2');
    const quoteTextInput = document.createElement('input');
    const categoryTextInput = document.createElement('input');
    const addButton = document.createElement('button');

    heading.textContent = "Add New Quote";

    quoteTextInput.type = "text";
    quoteTextInput.id = "newQuoteText";
    quoteTextInput.placeholder = "Enter a new quote";

    categoryTextInput.type = "text";
    categoryTextInput.id = "newQuoteCategory";
    categoryTextInput.placeholder = "Enter quote category";

    addButton.textContent = "Add Quote";
    addButton.onclick = addQuote;

    formDiv.appendChild(heading);
    formDiv.appendChild(quoteTextInput);
    formDiv.appendChild(categoryTextInput);
    formDiv.appendChild(addButton);

    addQuoteFormContainer.appendChild(formDiv);
}

// Function to add a new quote (addQuote)
async function addQuote() {
    const newQuoteTextInput = document.getElementById('newQuoteText');
    const newQuoteCategoryInput = document.getElementById('newQuoteCategory');

    const newQuoteText = newQuoteTextInput.value.trim();
    const newQuoteCategory = newQuoteCategoryInput.value.trim();

    if (newQuoteText === "" || newQuoteCategory === "") {
        alert("Please enter both quote text and category.");
        return;
    }

    const newQuote = {
        text: newQuoteText,
        category: newQuoteCategory
    };

    quotes.push(newQuote);
    saveQuotes();

    // Attempt to post the new quote to the server (mock API)
    await postQuoteToServer(newQuote);

    // After adding locally and attempting to post, resync to ensure consistency with server's state
    // This also handles updating categories and filter display
    await syncQuotes(); // Call syncQuotes after adding a quote to reflect potential server changes

    newQuoteTextInput.value = '';
    newQuoteCategoryInput.value = '';

    alert("Quote added successfully!");
    // The syncQuotes call above will eventually call filterQuotes
}

// --- Category Filtering Logic ---

// Function to populate categories dynamically (populateCategories)
function populateCategories() {
    const categories = ['all', ...new Set(quotes.map(quote => quote.category))];

    categoryFilterSelect.innerHTML = '<option value="all">All Categories</option>';

    categories.forEach(category => {
        if (category !== 'all') {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilterSelect.appendChild(option);
        }
    });

    const lastSelectedCategory = loadSelectedCategory();
    if (categories.includes(lastSelectedCategory)) {
        categoryFilterSelect.value = lastSelectedCategory;
    } else {
        categoryFilterSelect.value = 'all';
        saveSelectedCategory('all');
    }
}

// Function to filter quotes based on selected category (filterQuotes)
function filterQuotes() {
    const selectedCategory = categoryFilterSelect.value;
    saveSelectedCategory(selectedCategory);
    showRandomQuote();
}


// --- JSON Import/Export Functions ---

// Function to export quotes to JSON file
function exportQuotesToJson() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = "quotes.json";
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
            quotes = importedQuotes;
            saveQuotes();
            populateCategories();
            alert("Quotes imported successfully!");
            filterQuotes();
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

// 3. Attach syncQuotes to the "Sync with Server" button click
syncQuotesBtn.addEventListener('click', syncQuotes);

// 4. Initial setup when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    loadQuotes(); // Load quotes from local storage first
    populateCategories(); // Populate categories based on loaded quotes

    // Perform an initial sync when the page loads
    await syncQuotes();

    // After initial sync, re-load quotes and repopulate categories in case sync changed them
    loadQuotes();
    populateCategories();

    // Then, determine which quote to display
    const lastViewed = loadLastViewedQuote();
    const selectedCategoryOnLoad = loadSelectedCategory();

    const filteredQuotesForInit = selectedCategoryOnLoad === 'all'
        ? quotes
        : quotes.filter(quote => quote.category === selectedCategoryOnLoad);

    if (lastViewed && filteredQuotesForInit.some(q => q.text === lastViewed.text && q.category === lastViewed.category)) {
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
        showRandomQuote();
    }

    createAddQuoteForm(); // Dynamically create and display the "Add Quote" form

    // Periodically sync with the server (e.g., every 60 seconds)
    setInterval(syncQuotes, 60000); // Sync every 1 minute (adjust as needed for testing)
});
