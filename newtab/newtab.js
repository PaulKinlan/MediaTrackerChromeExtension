let mediaHistory = [];

// Format title for better readability
function formatTitle(title) {
    // Remove extra spaces and normalize whitespace
    title = title.trim().replace(/\s+/g, ' ');
    
    // Ensure proper capitalization
    title = title.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    return title;
}

// Truncate text with ellipsis
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Get file extension from URL and content type
function getFileExtension(url, contentType) {
    // Common media extensions
    const validExtensions = {
        video: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'm4v', 'flv'],
        audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma']
    };

    // Try to get extension from URL
    const urlMatch = url.toLowerCase().match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    if (urlMatch) {
        const ext = urlMatch[1].toLowerCase();
        // Check if the extension is valid for the content type
        if ((contentType === 'video' && validExtensions.video.includes(ext)) ||
            (contentType === 'audio' && validExtensions.audio.includes(ext))) {
            return '.' + ext;
        }
    }

    // Try to get extension from URL parameters
    try {
        const urlObj = new URL(url);
        const format = urlObj.searchParams.get('format');
        if (format) {
            const formatExt = format.toLowerCase();
            if ((contentType === 'video' && validExtensions.video.includes(formatExt)) ||
                (contentType === 'audio' && validExtensions.audio.includes(formatExt))) {
                return '.' + formatExt;
            }
        }
    } catch (e) {
        // Invalid URL, continue to fallback
    }

    // Fallback to default extensions
    const defaultExt = {
        'video': '.mp4',
        'audio': '.mp3'
    };

    return defaultExt[contentType] || '';
}

// Sanitize filename to remove invalid characters while preserving extension
function sanitizeFilename(filename, url, contentType) {
    // Get the extension from URL or content type
    const extension = getFileExtension(url, contentType);
    
    // Remove any existing extension and invalid characters from the filename
    filename = filename
        .replace(/\.[^/.]+$/, '') // Remove existing extension
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/^\.+/, '') // Remove leading dots
        .trim();
    
    // Ensure filename is not empty and not too long
    if (!filename) {
        filename = contentType + '_download';
    }
    
    // Limit filename length (Windows has 255 character limit including extension)
    const maxLength = 240 - extension.length;
    if (filename.length > maxLength) {
        filename = filename.substring(0, maxLength);
    }
    
    return filename + extension;
}

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

        // Format and truncate title
        const formattedTitle = formatTitle(item.title);
        const truncatedTitle = truncateText(formattedTitle, 70);
        const truncatedUrl = truncateText(item.url, 60);
        const truncatedPageUrl = truncateText(item.pageUrl, 60);

        mediaItem.innerHTML = `
            ${thumbnailHtml}
            <div class="media-content">
                <div class="media-title" title="${escapeHtml(formattedTitle)}">${escapeHtml(truncatedTitle)}</div>
                <div class="media-url">
                    <a href="${item.url}" target="_blank" title="${escapeHtml(item.url)}">${escapeHtml(truncatedUrl)}</a>
                </div>
                <div class="media-meta">
                    Type: ${item.type} | 
                    Found on: <a href="${item.pageUrl}" target="_blank" title="${escapeHtml(item.pageUrl)}">${escapeHtml(truncatedPageUrl)}</a> |
                    Time: ${new Date(item.timestamp).toLocaleString()}
                </div>
                <div class="media-actions">
                    <button class="download-btn" data-url="${item.url}" data-filename="${escapeHtml(formattedTitle)}" data-type="${item.type}">Download</button>
                    <button class="delete-btn" data-url="${item.url}" data-page-url="${item.pageUrl}" data-timestamp="${item.timestamp}">Delete</button>
                </div>
            </div>
        `;

        // Add download button click handler
        const downloadBtn = mediaItem.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => {
            const url = downloadBtn.dataset.url;
            const filename = sanitizeFilename(downloadBtn.dataset.filename, url, downloadBtn.dataset.type);
            chrome.downloads.download({
                url: url,
                filename: filename,
                conflictAction: 'uniquify'
            });
        });

        // Add delete button click handler
        const deleteBtn = mediaItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({
                type: 'DELETE_MEDIA',
                payload: {
                    url: deleteBtn.dataset.url,
                    pageUrl: deleteBtn.dataset.pageUrl,
                    timestamp: deleteBtn.dataset.timestamp
                }
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
                return formatTitle(a.title).localeCompare(formatTitle(b.title));
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
