# Media Logger Chrome Extension

A powerful Chrome extension that automatically detects and logs media (video/audio) from web pages with comprehensive history viewing capabilities. Built with Chrome's Manifest V3.

## Features

- 🎥 Automatic media detection (video and audio)
- 📝 Smart title extraction from various sources
- 🖼️ Video thumbnail generation
- 🔍 Advanced search and filtering capabilities
- 📅 Date range filtering
- 🗂️ Media type filtering (video/audio)
- ⬇️ Direct media download functionality
- 🗑️ Media entry deletion
- 📱 Responsive popup and full-page interfaces

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

### Quick Access (Popup)
- Click the extension icon in your toolbar to see recent media
- View the last 10 detected media items
- Download or delete media directly from the popup
- Click "View Full History" to open the detailed history page

### Full History (New Tab)
- Open a new tab to access your complete media history
- Use the search bar to find specific media
- Filter by:
  - Media type (video/audio)
  - Date range
  - Sort order (newest, oldest, title)
- View detailed information including:
  - Media title
  - Source URL
  - Original page URL
  - Timestamp
  - Video thumbnails (for video content)

## Technical Details

### Architecture
- Built with Chrome's Manifest V3 specifications
- Uses modern JavaScript features
- Implements real-time media detection
- Utilizes Chrome's storage API for data persistence
- Implements secure content script communication

### Components
- `content.js`: Handles media detection and thumbnail generation
- `background.js`: Manages storage and background operations
- `popup/*`: Quick access interface
- `newtab/*`: Full history viewing interface

### Security Features
- XSS protection through HTML escaping
- Filename sanitization for downloads
- Secure data handling
- Content isolation through Chrome's architecture

## UI Features

### Popup Interface
- Compact media list
- Quick access to recent items
- Essential media information
- Direct download capability
- Deletion functionality
- Full history access

### New Tab Interface
- Comprehensive search capabilities
- Advanced filtering options
- Detailed media information
- Thumbnail previews
- Responsive design
- Sorting capabilities

## Best Practices
- Smart title extraction from multiple sources
- Efficient storage management
- Real-time updates
- Responsive design
- User-friendly interfaces
- Performance optimization

## Privacy
- All data is stored locally
- No external server communication
- User data remains on their device
- No tracking or analytics

## Browser Support
- Chrome (Latest version)
- Chromium-based browsers (Edge, Brave, etc.)

## Notes
- The extension requires appropriate permissions to detect media on websites
- Some websites may restrict media access due to their security policies
- Video thumbnail generation requires the video to be loaded properly
