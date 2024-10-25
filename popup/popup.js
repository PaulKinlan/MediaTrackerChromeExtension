// Display recent media items
function displayMedia(mediaHistory) {
    const mediaList = document.getElementById('mediaList');
    mediaList.innerHTML = '';

    mediaHistory.slice(0, 10).forEach(item => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.innerHTML = `
            <div class="media-title">${item.title}</div>
            <div class="media-url">${item.url}</div>
            <div class="media-time">${new Date(item.timestamp).toLocaleString()}</div>
            <button class="download-btn" data-url="${item.url}" data-filename="${item.title}">Download</button>
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
