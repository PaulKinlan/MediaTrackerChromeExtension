// Handle storing media information
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'MEDIA_DETECTED') {
        chrome.storage.local.get(['mediaHistory'], (result) => {
            const mediaHistory = result.mediaHistory || [];
            // Prevent duplicates
            const isDuplicate = mediaHistory.some(item => 
                item.url === message.payload.url && 
                item.pageUrl === message.payload.pageUrl
            );
            
            if (!isDuplicate) {
                mediaHistory.unshift(message.payload);
                chrome.storage.local.set({
                    mediaHistory: mediaHistory.slice(0, 1000) // Limit to 1000 entries
                });
            }
        });
    }
    return true;
});
