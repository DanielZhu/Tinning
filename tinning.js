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
  syncTinningFolder: function (fetchTinningContentFlag) {
    var bookmarkTreeNodes = chrome.bookmarks.getSubTree("2",
      function(bookmarkTreeNodes) {
        var otherBookmarks = bookmarkTreeNodes[0].children;
        for (var i = 0; i < otherBookmarks.length; i++) {
          if (otherBookmarks[i].title === "Tinning") {
            tinning.tinningFolderId = otherBookmarks[i].id;
            tinning.updateBadge(otherBookmarks[i].children.length);
            // break;
          }
        }

        if (tinning.tinningFolderId === null) {
          tinning.addTinningFolder();
        } else {
           if (fetchTinningContentFlag) {
              tinning.fetchTinningFolderContent();
            }
        }
      }
    )
  },
  
  // Fetch all the bookmarks in the tinning folder
  fetchTinningFolderContent: function () {
    var bookmarkTreeNodes = chrome.bookmarks.getSubTree(tinning.tinningFolderId,
      function(bookmarkTreeNodes) {
        var tinnedList = [], tinnedListItem = [];
        var tinningBookmarks = bookmarkTreeNodes[0].children;
        // Iterate Tinning folder
        for (var i = 0; i < tinningBookmarks.length; i++) {
          var tinned = tinningBookmarks[i];
          tinnedListItem = [];
          tinnedListItem.title = tinned.title;
          if (tinned.children.length > 0) {
            // Iterate all the tinned item children
            for (var j = 0; j < tinned.children.length; j++) {
              var item = {};
              item.title = tinned.children[j].title; 
              item.url = tinned.children[j].url; 
              item.id = tinned.children[j].id;
              tinnedListItem.push(item);
            }
          }
          tinnedList.push({'item': tinnedListItem});
        }

        tinning.renderPopup({'tinnedList': tinnedList});
      }
    )
  },

  renderPopup: function (tinnedList) {
    // chrome://favicon/
    // Using jQuery to fetch the template
    var gridTpl   =  $("#tab-collection-grid-tpl").html();
    var listTpl   =  $("#tab-collection-list-tpl").html();

    // Precompile the template
    var gridTemplate = Handlebars.compile(gridTpl);
    var listTemplate = Handlebars.compile(listTpl);

    // Match the data
    var gridHtml = gridTemplate(tinnedList);
    var listHtml = listTemplate(tinnedList);

    // Render the html
    $('#tab-collection-grid').html(gridHtml);
    $('#tab-collection-list').html(listHtml);
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

  onRemoveBookmarks: function (id, removeInfo) {
    tinning.syncTinningFolder(false);
  },

  onCreatedBookmarks: function (id, bookmark) {
    tinning.syncTinningFolder(false);
  },

  registerEvent: function () {
    $("#tin-tabs").click(function (e) {
      tinning.collectTabs();
    });

  }
};