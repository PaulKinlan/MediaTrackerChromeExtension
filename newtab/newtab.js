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

// Rest of the code remains the same...
// [Previous code for sanitizeFilename, getFileExtension, escapeHtml, filterMedia, clearFilters, 
// event listeners, and storage change listener remains unchanged]
