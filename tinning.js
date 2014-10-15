// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Global variable containing the query we'd like to pass to Flickr. In this
 * case, kittens!
 *
 * @type {string}
 */
Array.prototype.removeAt = function (index) {
  if (this.length > index) {
    this.splice(index, 1);
  }
  return this;
}

var tinning = {
   tinningFolderId: null,
   configs: [],
   tinnedList: [],

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

  // Callback to tin tabs
  tinningTabs: function (tabs) {
    var now = new Date();
    var title = (now.getMonth() + 1) + "/" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes();

    // Create the folder to store the tabs for current window
    // Give them the temporary name
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

          if (storage.retrieveConfigByKey("close-tab-after-tin")) {
            chrome.tabs.remove(tab.id);
          }
        };
      }
    );
  },

  unTinningTabs: function (dataIndex) {
      var collectItem = tinning.tinnedList[dataIndex];
      console.log(JSON.stringify(collectItem));

      collectItem.item.forEach(function (tab) {
        // TODO
        if (storage.retrieveConfigByKey("open-tabs-in-new-window")) {
          chrome.tabs.create({url: tab.url})
        }
      });

      tinning.tinnedList.removeAt(dataIndex);

      // Remove the related bookmarks
      chrome.bookmarks.removeTree(collectItem.item.id);
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
        var tinnedListItem = [];
        tinning.tinnedList = [];
        var tinningBookmarks = bookmarkTreeNodes[0].children;
        // Iterate Tinning folder
        for (var i = 0; i < tinningBookmarks.length; i++) {
          var tinned = tinningBookmarks[i];
          tinnedListItem = [];
          tinnedListItem.title = tinned.title;
          tinnedListItem.id = tinned.id;
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
          tinning.tinnedList.push({'item': tinnedListItem});
        }

        tinning.renderPopup();
      }
    )
  },

  renderPopup: function () {
    $('#tab-collection').html("");
    var displayMode = storage.retrieveConfigByKey("display_mode");
    if (displayMode === "Grid") {
      // Using jQuery to fetch the template
      var tpl   =  $("#tab-collection-grid-tpl").html();
    } else if (displayMode === "List") {
      var tpl   =  $("#tab-collection-list-tpl").html();
    }
    // Precompile the template
    var template = Handlebars.compile(tpl);
    
    // Match the data
    var html = template({'tinnedList': tinning.tinnedList});

    // Render the html
    $('#tab-collection').html(html);

    $("#tab-collection > ul > li")
    .mouseenter(function () {
      $(this).addClass("hover");
    })
    .mouseleave(function () {
      $(this).removeClass("hover");
    })
    .click(function (e) {
      var dataIndex = $(this).attr("dataIndex");
      tinning.unTinningTabs(dataIndex);
    });
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

  onOptionClicked: function (element) {
    var margin = 10;
    // Popopver bottom
    $("#option-arrow").toggleClass("arrow-rotate");
    $(".popover.bottom").css("left", element.currentTarget.x - $(".popover.bottom").width() / 2);
    $(".popover.bottom").css("top", element.currentTarget.y + element.currentTarget.height + margin);
    $("#option-arrow").hasClass("arrow-rotate") ? $(".popover.bottom").fadeIn() : $(".popover.bottom").fadeOut();
  },

  syncConfig: function () {
    this.configs = storage.iniConfigs();
    
    if (this.configs.display_mode === "grid") {
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", true);
    } else if (this.configs.display_mode === "list") {
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", false);
    }
  },

  registerEvent: function () {
    $("#tin-tabs").click(function (e) {
      tinning.collectTabs();
    });

    $("#option-arrow").click(function (element) {
      tinning.onOptionClicked(element);
    });

    $("#display-mode .radio-item").click(function (element) {
      var displayMode = $("#display-mode .radio-slider").hasClass("radio-slider-move");
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", !displayMode);
      storage.setConfigValueByKey("display_mode", (!displayMode ? "Grid" : "List"));
      tinning.fetchTinningFolderContent();
    });

    $("#display .radio-item").click(function (element) {
      $("#display .radio-slider").toggleClass("radio-slider-move", !$("#display .radio-slider").hasClass("radio-slider-move"));
    });
  }
};