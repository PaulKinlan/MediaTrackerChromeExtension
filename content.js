// Function to capture video thumbnail with enhanced CORS handling
async function captureVideoThumbnail(videoElement) {
    return new Promise(async (resolve) => {
        // Track if we've successfully captured a thumbnail
        let thumbnailCaptured = false;

        // Method 1: Try poster attribute first
        const posterUrl = videoElement.getAttribute('poster');
        if (posterUrl && !thumbnailCaptured) {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                // Create a blob URL if the poster is a blob
                if (posterUrl.startsWith('blob:')) {
                    const response = await fetch(posterUrl);
                    const blob = await response.blob();
                    img.src = URL.createObjectURL(blob);
                } else {
                    img.src = posterUrl;
                }

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                const canvas = document.createElement('canvas');
                canvas.width = 160;
                canvas.height = 90;
                const context = canvas.getContext('2d');
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                thumbnailCaptured = true;
                resolve(dataUrl);
            } catch (error) {
                console.log('Poster capture failed, trying video frame capture');
            }
        }

        // Method 2: Try direct frame capture if poster failed or doesn't exist
        if (!thumbnailCaptured) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 160;
                canvas.height = 90;
                const context = canvas.getContext('2d');

                // Function to capture frame
                const captureFrame = () => {
                    try {
                        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        thumbnailCaptured = true;
                        resolve(dataUrl);
                    } catch (error) {
                        if (error.name === 'SecurityError') {
                            // If CORS error, try creating a local copy
                            createLocalCopy();
                        } else {
                            console.error('Frame capture error:', error);
                            resolve(null);
                        }
                    }
                };

                // Create a local copy of the video to bypass CORS
                const createLocalCopy = async () => {
                    try {
                        const response = await fetch(videoElement.src);
                        const blob = await response.blob();
                        const localUrl = URL.createObjectURL(blob);
                        const tempVideo = document.createElement('video');
                        tempVideo.crossOrigin = 'anonymous';
                        tempVideo.src = localUrl;
                        
                        tempVideo.addEventListener('loadeddata', () => {
                            try {
                                context.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                URL.revokeObjectURL(localUrl);
                                thumbnailCaptured = true;
                                resolve(dataUrl);
                            } catch (error) {
                                console.error('Local copy capture error:', error);
                                URL.revokeObjectURL(localUrl);
                                resolve(null);
                            }
                        });

                        tempVideo.addEventListener('error', () => {
                            console.error('Local copy loading error');
                            URL.revokeObjectURL(localUrl);
                            resolve(null);
                        });
                    } catch (error) {
                        console.error('Local copy creation error:', error);
                        resolve(null);
                    }
                };

                // If video is ready, capture frame, otherwise wait for it
                if (videoElement.readyState >= 2) {
                    captureFrame();
                } else {
                    videoElement.addEventListener('loadeddata', captureFrame);
                }
            } catch (error) {
                console.error('Video capture error:', error);
                resolve(null);
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
