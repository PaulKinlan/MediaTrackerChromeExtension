// Function to capture video thumbnail
async function captureVideoThumbnail(videoElement) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;  // thumbnail width
        canvas.height = 90;  // 16:9 aspect ratio

        // Wait for video metadata to load
        if (videoElement.readyState >= 2) {
            captureFrame();
        } else {
            videoElement.addEventListener('loadeddata', captureFrame);
        }

        function captureFrame() {
            const context = canvas.getContext('2d');
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        }
    });
}

// Function to extract media information
async function extractMediaInfo(element) {
    const info = {
        url: element.src || element.currentSrc,
        title: element.title || document.title,
        type: element.tagName.toLowerCase(),
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        thumbnail: null
    };

    if (element.tagName.toLowerCase() === 'video') {
        try {
            info.thumbnail = await captureVideoThumbnail(element);
        } catch (error) {
            console.error('Failed to capture thumbnail:', error);
        }
    }

    return info;
}

// Function to detect media elements
async function detectMedia() {
    const mediaElements = document.querySelectorAll('video, audio');
    for (const element of mediaElements) {
        if (!element.dataset.logged) {
            const mediaInfo = await extractMediaInfo(element);
            chrome.runtime.sendMessage({
                type: 'MEDIA_DETECTED',
                payload: mediaInfo
            });
            element.dataset.logged = 'true';
        }
    }
}

// Initial detection
detectMedia();

// Observer for dynamic content
const observer = new MutationObserver(() => detectMedia());
observer.observe(document.body, {
    childList: true,
    subtree: true
});
