let mediaHistory = [];

// Display media items
function displayMedia(items) {
    const mediaList = document.getElementById('mediaList');
    const noResults = document.getElementById('noResults');
    mediaList.innerHTML = '';

    if (items.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    items.forEach(item => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.innerHTML = `
            <div class="media-title">${escapeHtml(item.title)}</div>
            <div class="media-url">
                <a href="${item.url}" target="_blank">${escapeHtml(item.url)}</a>
            </div>
            <div class="media-meta">
                Type: ${item.type} | 
                Found on: <a href="${item.pageUrl}" target="_blank">${escapeHtml(item.pageUrl)}</a> |
                Time: ${new Date(item.timestamp).toLocaleString()}
            </div>
        `;
        mediaList.appendChild(mediaItem);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Filter and sort media items
function filterMedia() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filterType = document.getElementById('filter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = [...mediaHistory];

    // Apply type filter
    if (filterType !== 'all') {
        filtered = filtered.filter(item => item.type === filterType);
    }

    // Apply date filter
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filtered = filtered.filter(item => new Date(item.timestamp) >= fromDate);
    }
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => new Date(item.timestamp) <= toDate);
    }

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.url.toLowerCase().includes(searchTerm) ||
            item.pageUrl.toLowerCase().includes(searchTerm)
        );
    }

    // Apply sorting
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'oldest':
                return new Date(a.timestamp) - new Date(b.timestamp);
            case 'title':
                return a.title.localeCompare(b.title);
            case 'newest':
            default:
                return new Date(b.timestamp) - new Date(a.timestamp);
        }
    });

    displayMedia(filtered);
}

// Clear all filters
function clearFilters() {
    document.getElementById('search').value = '';
    document.getElementById('filter').value = 'all';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('sortBy').value = 'newest';
    filterMedia();
}

// Load media history
chrome.storage.local.get(['mediaHistory'], (result) => {
    mediaHistory = result.mediaHistory || [];
    filterMedia();
});

// Event listeners
document.getElementById('search').addEventListener('input', filterMedia);
document.getElementById('filter').addEventListener('change', filterMedia);
document.getElementById('dateFrom').addEventListener('change', filterMedia);
document.getElementById('dateTo').addEventListener('change', filterMedia);
document.getElementById('sortBy').addEventListener('change', filterMedia);
document.getElementById('clearSearch').addEventListener('click', clearFilters);

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.mediaHistory) {
        mediaHistory = changes.mediaHistory.newValue;
        filterMedia();
    }
});
