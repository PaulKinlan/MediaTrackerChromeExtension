// Display recent media items
function displayMedia(mediaHistory) {
    const mediaList = document.getElementById('mediaList');
    mediaList.innerHTML = '';

    mediaHistory.slice(0, 10).forEach(item => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        
        // Create thumbnail element for videos
        const thumbnailHtml = item.type === 'video' && item.thumbnail ? 
            `<div class="media-thumbnail">
                <img src="${item.thumbnail}" alt="Video thumbnail">
            </div>` : '';

        // Format title for better readability
        const formattedTitle = formatTitle(item.title);
        const truncatedTitle = truncateText(formattedTitle, 50);
        
        mediaItem.innerHTML = `
            ${thumbnailHtml}
            <div class="media-content">
                <div class="media-title" title="${formattedTitle}">${truncatedTitle}</div>
                <div class="media-url">${truncateText(item.url, 40)}</div>
                <div class="media-time">${new Date(item.timestamp).toLocaleString()}</div>
                <div class="media-actions">
                    <button class="download-btn" data-url="${item.url}" data-filename="${formattedTitle}" data-type="${item.type}">Download</button>
                    <button class="delete-btn" data-url="${item.url}" data-page-url="${item.pageUrl}" data-timestamp="${item.timestamp}">Delete</button>
                </div>
            </div>
        `;
        mediaList.appendChild(mediaItem);

        // Add download button click handler
        const downloadBtn = mediaItem.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => {
            const url = downloadBtn.dataset.url;
            const filename = sanitizeFilename(downloadBtn.dataset.filename, url, downloadBtn.dataset.type);
            chrome.downloads.download({
                url: url,
                filename: filename
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
    });
}

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
    // Try to get extension from URL
    const urlMatch = url.toLowerCase().match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    if (urlMatch && ['mp4', 'mp3', 'wav', 'webm', 'ogg', 'm4a', 'aac'].includes(urlMatch[1])) {
        return '.' + urlMatch[1];
    }

    // Fallback to content type mapping
    const typeToExt = {
        'video': '.mp4',
        'audio': '.mp3'
    };

    return typeToExt[contentType] || '';
}

// Sanitize filename to remove invalid characters while preserving extension
function sanitizeFilename(filename, url, contentType) {
    // Get the extension from URL or content type
    const extension = getFileExtension(url, contentType);
    
    // Remove any existing extension from the filename
    filename = filename.replace(/\.[^/.]+$/, '');
    
    // Replace invalid characters with underscore
    const sanitized = filename.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Ensure filename is not empty
    if (!sanitized) {
        return 'download' + extension;
    }
    
    return sanitized + extension;
}

// Load media history
chrome.storage.local.get(['mediaHistory'], (result) => {
    const mediaHistory = result.mediaHistory || [];
    displayMedia(mediaHistory);
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.mediaHistory) {
        const mediaHistory = changes.mediaHistory.newValue || [];
        displayMedia(mediaHistory);
    }
});

// View full history button
document.getElementById('viewAll').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://newtab' });
});
