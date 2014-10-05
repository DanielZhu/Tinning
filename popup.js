// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Global variable containing the query we'd like to pass to Flickr. In this
 * case, kittens!
 *
 * @type {string}
 */

var tinning = {
   tinningFolderId: null,


  /**
   * Sends an XHR GET request to grab photos of lots and lots of kittens. The
   * XHR's 'onload' event is hooks up to the 'showPhotos_' method.
   *
   * @public
   */
  requestKittens: function() {
    // var req = new XMLHttpRequest();
    // req.open("GET", this.searchOnFlickr_, true);
    // req.onload = this.showPhotos_.bind(this);
    // req.send(null);
  },

  updateBadge: function (bargeText) {
    var bargeOption = {};
    bargeOption.text = bargeText.toString();
    chrome.browserAction.setBadgeText(bargeOption);
  },

  collectTabs: function () {
    var queryOption = {};
    queryOption.currentWindow = true;
    chrome.tabs.query(queryOption, this.tinningTabs);
  },

  tinningTabs: function (tabs) {
    // Create the folder to store the tabs for current window
    var now = new Date();
    var title = (now.getMonth() + 1) + "/" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes();
    chrome.bookmarks.create({
        "parentId": tinning.tinningFolderId,
        "title": title + " " + tabs[0].title
      },
      function(newFolder) {
        for (var i = 0; i < tabs.length; i++) {
          var tab = tabs[i];
          chrome.bookmarks.create({
            "parentId": newFolder.id,
            "title": tab.title,
            "url": tab.url
          });
        };
      }
    );
  },

  // Sync
  syncTinningFolder: function () {
    var bookmarkTreeNodes = chrome.bookmarks.getSubTree("2",
      function(bookmarkTreeNodes) {
        var otherBookmarks = bookmarkTreeNodes[0].children;
        for (var i = 0; i < otherBookmarks.length; i++) {
          if (otherBookmarks[i].title === "Tinning") {
            tinning.tinningFolderId = otherBookmarks[i].id;
            tinning.updateBadge(otherBookmarks[i].children.length);
          }
        }

        if (tinning.tinningFolderId === null) {
          tinning.addTinningFolder();
        }
      }
    )
  },
  addTinningFolder: function () {
    chrome.bookmarks.create(
      {
        "title": "Tinning"
      },
      function(newFolder) {
        tinning.tinningFolderId = newFolder.id;
      }
    );
  },

  registerEvent: function () {
    $("#tin-tabs").click(function (e) {
      tinning.collectTabs();
    });
  }
};

// Run our kitten generation script as soon as the document's DOM is ready.
$(document).ready(function(){
  console.log("ready ");
  tinning.registerEvent();
  tinning.syncTinningFolder();
});
