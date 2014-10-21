  // Init the tinning important configurations in this method when the extension installed.
tinning.syncTinningFolder(false);
tinning.registerScrollToLastPositionListener();

// Listen the event of bookmarks in background
chrome.bookmarks.onRemoved.addListener(tinning.onRemoveBookmarks);
chrome.bookmarks.onCreated.addListener(tinning.onCreatedBookmarks);
