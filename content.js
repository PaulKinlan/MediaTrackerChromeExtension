// Function to extract media information
function extractMediaInfo(element) {
    return {
        url: element.src || element.currentSrc,
        title: element.title || document.title,
        type: element.tagName.toLowerCase(),
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href
    };
}

// Function to detect media elements
function detectMedia() {
    const mediaElements = document.querySelectorAll('video, audio');
    mediaElements.forEach(element => {
        if (!element.dataset.logged) {
            const mediaInfo = extractMediaInfo(element);
            chrome.runtime.sendMessage({
                type: 'MEDIA_DETECTED',
                payload: mediaInfo
            });
            element.dataset.logged = 'true';
        }
    });
}

// Initial detection
detectMedia();

// Observer for dynamic content
const observer = new MutationObserver(detectMedia);
observer.observe(document.body, {
    childList: true,
    subtree: true
});
