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
        `;
        mediaList.appendChild(mediaItem);
    });
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
