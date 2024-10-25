let mediaHistory = [];

// Display media items
function displayMedia(items) {
    const mediaList = document.getElementById('mediaList');
    mediaList.innerHTML = '';

    items.forEach(item => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.innerHTML = `
            <div class="media-title">${item.title}</div>
            <div class="media-url">
                <a href="${item.url}" target="_blank">${item.url}</a>
            </div>
            <div class="media-meta">
                Type: ${item.type} | 
                Found on: <a href="${item.pageUrl}" target="_blank">${item.pageUrl}</a> |
                Time: ${new Date(item.timestamp).toLocaleString()}
            </div>
        `;
        mediaList.appendChild(mediaItem);
    });
}

// Filter media items
function filterMedia() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filterType = document.getElementById('filter').value;

    let filtered = mediaHistory;

    if (filterType !== 'all') {
        filtered = filtered.filter(item => item.type === filterType);
    }

    if (searchTerm) {
        filtered = filtered.filter(item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.url.toLowerCase().includes(searchTerm)
        );
    }

    displayMedia(filtered);
}

// Load media history
chrome.storage.local.get(['mediaHistory'], (result) => {
    mediaHistory = result.mediaHistory || [];
    displayMedia(mediaHistory);
});

// Event listeners
document.getElementById('search').addEventListener('input', filterMedia);
document.getElementById('filter').addEventListener('change', filterMedia);

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.mediaHistory) {
        mediaHistory = changes.mediaHistory.newValue;
        filterMedia();
    }
});
