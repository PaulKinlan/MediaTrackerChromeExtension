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

        // Create thumbnail element for videos
        const thumbnailHtml = item.type === 'video' && item.thumbnail ? 
            `<div class="media-thumbnail">
                <img src="${item.thumbnail}" alt="Video thumbnail">
            </div>` : '';

        mediaItem.innerHTML = `
            ${thumbnailHtml}
            <div class="media-content">
                <div class="media-title">${escapeHtml(item.title)}</div>
                <div class="media-url">
                    <a href="${item.url}" target="_blank">${escapeHtml(item.url)}</a>
                </div>
                <div class="media-meta">
                    Type: ${item.type} | 
                    Found on: <a href="${item.pageUrl}" target="_blank">${escapeHtml(item.pageUrl)}</a> |
                    Time: ${new Date(item.timestamp).toLocaleString()}
                </div>
                <button class="download-btn" data-url="${item.url}" data-filename="${escapeHtml(item.title)}">Download</button>
            </div>
        `;

        // Add download button click handler
        const downloadBtn = mediaItem.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => {
            chrome.downloads.download({
                url: downloadBtn.dataset.url,
                filename: sanitizeFilename(downloadBtn.dataset.filename)
            });
        });

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

// Sanitize filename to remove invalid characters
function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9-_]/g, '_') + getFileExtension(filename);
}

// Get file extension from URL
function getFileExtension(url) {
    const match = url.match(/\.(mp4|mp3|wav|webm)$/i);
    return match ? match[0] : '';
}

// Filter media based on search, type, and date range
function filterMedia() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filterType = document.getElementById('filter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = mediaHistory.filter(item => {
        const matchesSearch = !searchTerm ||
            item.title.toLowerCase().includes(searchTerm) ||
            item.url.toLowerCase().includes(searchTerm) ||
            item.pageUrl.toLowerCase().includes(searchTerm);

        const matchesType = filterType === 'all' || item.type === filterType;

        const itemDate = new Date(item.timestamp);
        const matchesDateFrom = !dateFrom || itemDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || itemDate <= new Date(dateTo + 'T23:59:59');

        return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.timestamp) - new Date(a.timestamp);
            case 'oldest':
                return new Date(a.timestamp) - new Date(b.timestamp);
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
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

// Initialize the page
function initialize() {
    // Load initial media history
    chrome.storage.local.get(['mediaHistory'], (result) => {
        mediaHistory = result.mediaHistory || [];
        filterMedia();
    });

    // Add event listeners
    document.getElementById('search').addEventListener('input', filterMedia);
    document.getElementById('filter').addEventListener('change', filterMedia);
    document.getElementById('dateFrom').addEventListener('change', filterMedia);
    document.getElementById('dateTo').addEventListener('change', filterMedia);
    document.getElementById('sortBy').addEventListener('change', filterMedia);
    document.getElementById('clearSearch').addEventListener('click', clearFilters);

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.mediaHistory) {
            mediaHistory = changes.mediaHistory.newValue || [];
            filterMedia();
        }
    });
}

// Start initialization when the page loads
document.addEventListener('DOMContentLoaded', initialize);
