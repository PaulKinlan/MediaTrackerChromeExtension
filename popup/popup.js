// Display recent media items
function displayMedia(mediaHistory) {
    const mediaList = document.getElementById('mediaList');
    mediaList.innerHTML = '';

    mediaHistory.slice(0, 10).forEach(item => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        
        // Create thumbnail element for videos with play overlay
        const thumbnailHtml = item.type === 'video' && item.thumbnail ? 
            `<div class="media-thumbnail">
                <img src="${item.thumbnail}" alt="Video thumbnail">
                <div class="play-overlay"></div>
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
                    <button class="play-btn" data-url="${item.url}" data-type="${item.type}">Play</button>
                    <button class="download-btn" data-url="${item.url}" data-filename="${formattedTitle}" data-type="${item.type}">Download</button>
                    <button class="delete-btn" data-url="${item.url}" data-page-url="${item.pageUrl}" data-timestamp="${item.timestamp}">Delete</button>
                </div>
            </div>
        `;
        mediaList.appendChild(mediaItem);

        // Add play functionality for thumbnail and play button
        if (item.type === 'video') {
            const thumbnail = mediaItem.querySelector('.media-thumbnail');
            if (thumbnail) {
                thumbnail.addEventListener('click', () => playMedia(item.url, item.type));
            }
        }

        // Add play button click handler
        const playBtn = mediaItem.querySelector('.play-btn');
        playBtn.addEventListener('click', () => playMedia(item.url, item.type));

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
    });
}

// Handle media playback
function playMedia(url, type) {
    const modal = document.querySelector('.media-modal');
    const playerContainer = modal.querySelector('.media-player');
    const closeBtn = modal.querySelector('.close-modal');

    // Create media element
    const mediaElement = document.createElement(type);
    mediaElement.src = url;
    mediaElement.controls = true;
    mediaElement.autoplay = true;
    mediaElement.className = 'media-player';

    // Clear previous content and add new media element
    playerContainer.innerHTML = '';
    playerContainer.appendChild(mediaElement);

    // Show modal
    modal.classList.add('active');

    // Handle close button click
    closeBtn.onclick = () => {
        modal.classList.remove('active');
        mediaElement.pause();
        mediaElement.src = '';
        playerContainer.innerHTML = '';
    };

    // Handle click outside modal
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeBtn.onclick();
        }
    };

    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeBtn.onclick();
        }
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
    // Common media extensions
    const validExtensions = {
        video: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'm4v', 'flv'],
        audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma']
    };

    // Try to get extension from URL
    const urlMatch = url.toLowerCase().match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    if (urlMatch) {
        const ext = urlMatch[1].toLowerCase();
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
