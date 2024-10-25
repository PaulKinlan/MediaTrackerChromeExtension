// Function to capture video thumbnail
async function captureVideoThumbnail(videoElement) {
    return new Promise((resolve) => {
        // First check if video has a poster attribute
        const posterUrl = videoElement.getAttribute('poster');
        if (posterUrl) {
            // Create an image element to load the poster
            const img = new Image();
            img.crossOrigin = 'anonymous';  // Handle CORS
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = 160;  // thumbnail width
                canvas.height = 90;  // 16:9 aspect ratio
                const context = canvas.getContext('2d');
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = function() {
                // Fallback to video frame capture if poster loading fails
                captureFromVideo();
            };
            img.src = posterUrl;
        } else {
            // No poster attribute, capture from video
            captureFromVideo();
        }

        function captureFromVideo() {
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
        }
    });
}

// Function to extract title from URL
function extractTitleFromUrl(url) {
    try {
        const urlObj = new URL(url);
        // Get the filename from the path
        let filename = urlObj.pathname.split('/').pop();
        // Remove extension and decode URI components
        filename = decodeURIComponent(filename.replace(/\.[^/.]+$/, ''));
        // Replace common separators with spaces
        filename = filename.replace(/[-_+]/g, ' ');
        // Capitalize first letter of each word
        filename = filename.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        return filename;
    } catch (e) {
        return '';
    }
}

// Function to get closest heading
function getClosestHeading(element) {
    let current = element;
    while (current && current !== document) {
        // Check previous siblings
        let sibling = current.previousElementSibling;
        while (sibling) {
            const heading = sibling.querySelector('h1, h2, h3, h4, h5, h6');
            if (heading) return heading.textContent.trim();
            sibling = sibling.previousElementSibling;
        }
        // Move up to parent
        current = current.parentElement;
    }
    return null;
}

// Function to extract smart title
function extractSmartTitle(element, url) {
    // Try to get title from element attributes
    const elementTitle = element.title || element.getAttribute('aria-label');
    if (elementTitle) return elementTitle;

    // Try to get title from nearby heading
    const headingTitle = getClosestHeading(element);
    if (headingTitle) return headingTitle;

    // Try to get title from meta tags
    const metaTitle = document.querySelector('meta[property="og:title"]')?.content ||
                     document.querySelector('meta[name="title"]')?.content;
    if (metaTitle) return metaTitle;

    // Try to get title from page title
    const pageTitle = document.title;
    if (pageTitle && pageTitle !== 'newtab') return pageTitle;

    // Extract from URL as last resort
    const urlTitle = extractTitleFromUrl(url);
    if (urlTitle) return urlTitle;

    // Fallback
    return 'Untitled Media';
}

// Function to extract media information
async function extractMediaInfo(element) {
    const url = element.src || element.currentSrc;
    const info = {
        url: url,
        title: extractSmartTitle(element, url),
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
