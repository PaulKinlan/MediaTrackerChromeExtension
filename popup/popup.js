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
                <button class="download-btn" data-url="${item.url}" data-filename="${formattedTitle}">Download</button>
            </div>
        `;
        mediaList.appendChild(mediaItem);

        // Add download button click handler
        const downloadBtn = mediaItem.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => {
            chrome.downloads.download({
                url: downloadBtn.dataset.url,
                filename: sanitizeFilename(downloadBtn.dataset.filename)
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
    
    // Remove common file extensions
    title = title.replace(/\.(mp4|mp3|wav|webm)$/i, '');
    
    return title;
}

// Truncate text with ellipsis
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
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

// Load media history
chrome.storage.local.get(['mediaHistory'], (result) => {
    const mediaHistory = result.mediaHistory || [];
    displayMedia(mediaHistory);
});

// View full history button
document.getElementById('viewAll').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://newtab' });
});
