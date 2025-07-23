// Initial quotes array - will be populated from localStorage or server
let quotes = [];

// API Endpoint for mock server
const API_URL = 'https://jsonplaceholder.typicode.com/posts'; // Using posts as a mock for quotes

// Get references to key DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const addQuoteFormContainer = document.getElementById('addQuoteFormContainer');
const exportQuotesButton = document.getElementById('exportQuotes');
const importFileInput = document.getElementById('importFile');
const categoryFilterSelect = document.getElementById('categoryFilter');
const notificationDiv = document.getElementById('notification'); // NEW
const notificationMessage = document.getElementById('notificationMessage'); // NEW
const resolveConflictBtn = document.getElementById('resolveConflictBtn'); // NEW
const syncQuotesBtn = document.getElementById('syncQuotesBtn'); // NEW

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
    }
    // If no quotes, array remains empty, or you could load initial default quotes
    // if (!storedQuotes && quotes.length === 0) {
    //     quotes = [ /* your initial default quotes here if you want them on first load */ ];
    //     saveQuotes();
    // }
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
    return localStorage.getItem('selectedCategory') || 'all'; // Default to 'all'
}

// --- NEW: Notification and Conflict UI ---

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
    // Hide notification after some time if not a conflict
    if (!isConflict) {
        setTimeout(() => {
            notificationDiv.classList.remove('show');
        }, 5000);
    }
}

// Function to hide the notification
function hideNotification() {
    notificationDiv.classList.remove('show');
    notificationMessage.textContent = '';
    resolveConflictBtn.style.display = 'none';
}

// --- NEW: Server Syncing Functions ---

// Mock function to transform API response to our quote format
function transformApiDataToQuotes(data) {
    return data.map(item => ({
        text: item.title || item.body, // Use title or body as quote text
        category: "Server" // Assign a default category for server-fetched quotes
    }));
}

// Function to fetch quotes from the server
async function fetchQuotesFromServer() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const serverQuotesRaw = await response.json();
        // Take only a few quotes to simulate a smaller dataset or for testing
        const serverQuotes = transformApiDataToQuotes(serverQuotesRaw.slice(0, 10)); // Fetch top 10 as examples
        return serverQuotes;
    } catch (error) {
        console.error("Error fetching quotes from server:", error);
        showNotification("Failed to fetch quotes from server. Check console for details.");
        return []; // Return empty array on error
    }
}

// Function to post a new quote to the server (mock API, won't actually save)
async function postQuoteToServer(quote) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                title: quote.text,
                body: `Category: ${quote.category}`,
                userId: 1, // Required by JSONPlaceholder
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        console.log("Quote posted to mock server (not actually saved):", responseData);
        // showNotification("Quote sent to server (mock)."); // Optional feedback
    } catch (error) {
        console.error("Error posting quote to server:", error);
        showNotification("Failed to post quote to server (mock). Check console for details.");
    }
}

// Sync function with conflict resolution (server data takes precedence)
async function syncQuotes() {
    showNotification("Syncing with server...");
    const serverQuotes = await fetchQuotesFromServer();
    const localQuotes = quotes; // Current quotes array (from localStorage)

    let conflictOccurred = false;
    let newQuotesAdded = 0;
    let quotesUpdated = 0;

    // Simple conflict resolution: Server data takes precedence.
    // We'll merge based on text content (assuming text is unique enough for this simple example).
    // In a real app, you'd use unique IDs.

    const newQuotesArray = [...serverQuotes]; // Start with all server quotes

    localQuotes.forEach(localQuote => {
        // Check if local quote exists on server based on text
        const serverEquivalent = serverQuotes.find(sq => sq.text === localQuote.text);

        if (!serverEquivalent) {
            // Local quote does not exist on server, so it's a new local quote
            // Add it if we decide local changes are secondary (server precedence)
            // For this simple example, if server takes precedence, we only add local if not on server.
            // If the server *could* have deleted it, we wouldn't add it back.
            // For now, assume server only *adds* new items.
            newQuotesArray.push(localQuote);
            newQuotesAdded++;
        } else {
            // Quote exists on both. Server takes precedence for content.
            // If they are different, it's a conflict.
            if (localQuote.category !== serverEquivalent.category || localQuote.text !== serverEquivalent.text) {
                // If text is different, the `find` wouldn't have worked. So mainly category difference here.
                quotesUpdated++;
                conflictOccurred = true;
                // No explicit action needed for server precedence, as newQuotesArray started with serverQuotes.
            }
        }
    });

    // If server provides a more recent version of a quote, our local one is overwritten
    // This is implicitly handled by `newQuotesArray = [...serverQuotes]` and then adding unique local ones.
    quotes = newQuotesArray;
    saveQuotes(); // Save the merged result to local storage
    populateCategories(); // Update categories based on new quotes
    filterQuotes(); // Refresh displayed quotes

    let syncMessage = "Sync complete. ";
    if (newQuotesAdded > 0) {
        syncMessage += `${newQuotesAdded} new quotes from local added. `;
    }
    if (quotesUpdated > 0) {
        syncMessage += `${quotesUpdated} local quotes updated by server. `;
        conflictOccurred = true; // Mark as conflict if any were updated by server precedence
    }
    if (newQuotesAdded === 0 && quotesUpdated === 0 && serverQuotes.length > 0) {
        syncMessage += `Fetched ${serverQuotes.length} server quotes. No new local quotes.`;
    } else if (newQuotesAdded === 0 && quotesUpdated === 0 && serverQuotes.length === 0 && localQuotes.length === 0) {
        syncMessage += `No quotes found locally or on server.`;
    } else if (newQuotesAdded === 0 && quotesUpdated === 0 && serverQuotes.length === localQuotes.length) {
         syncMessage += `No new changes. Quotes are synchronized.`;
    }

    if (conflictOccurred) {
        showNotification(syncMessage + " Some local changes were overwritten by server data. You can resolve manually if needed.", true);
    } else {
        showNotification(syncMessage + " All quotes are synchronized.");
    }
}

// Placeholder for manual conflict resolution (e.g., show a modal)
function resolveConflictManually() {
    alert("Manual conflict resolution: In a real application, a UI would appear here to let you choose which version of conflicting quotes to keep.");
    hideNotification(); // Hide notification after manual resolution initiated
    // In a real app, you might re-display affected quotes or show a specific UI.
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
async function addQuote() { // Made async to await postToServer
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
    await postQuoteToServer(newQuote); // Wait for the mock API call

    populateCategories();
    categoryFilterSelect.value = newQuoteCategory;
    saveSelectedCategory(newQuoteCategory);

    newQuoteTextInput.value = '';
    newQuoteCategoryInput.value = '';

    alert("Quote added successfully!");
    filterQuotes();
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

// 3. NEW: Attach syncQuotes to the "Sync with Server" button click
syncQuotesBtn.addEventListener('click', syncQuotes);

// 4. Initial setup when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    loadQuotes(); // Load quotes from local storage first
    populateCategories(); // Populate categories based on loaded quotes

    // Attempt an initial sync when the page loads
    await syncQuotes(); // Perform initial sync to get server data

    // After sync, reload quotes again (in case sync updated them)
    loadQuotes();
    populateCategories(); // Re-populate categories if quotes changed due to sync

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
    setInterval(syncQuotes, 60000); // Sync every 1 minute (adjust as needed)
});
