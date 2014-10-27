/*global chrome: false, storage: false, console: false, IScroll: false, Handlebars: false; */
"use strict";

// Copyright (c) 2014 Zhu Meng-Dan(Daniel). All rights reserved.


// Init the tinning important configurations in this method when the extension installed.
Array.prototype.removeAt = function (index) {
  if (this.length > index) {
    this.splice(index, 1);
  }
  return this;
};

Array.prototype.contains = function (item, compareFields) {
  var appearAt = -1;

  if (this.length === 0) return appearAt;
  this.filter(function (value, index) {
    for(var i = 0; i < compareFields.length; i++) {
      if (item[compareFields[i]] !== value[compareFields[i]]) {
        return false;
      }
    }
    appearAt = index;
    return true;
  });

  return appearAt;
};

Array.prototype.asyncEach = function(iterator) {
  var list = this,
      n    = list.length,
      i    = -1;
  
  var iterate = function() {
    i += 1;
    if (i === n) return;
    iterator(list[i], resume);
  };
  
  var resume = function() {
    setTimeout(iterate, 1);
  };
  resume();
};

function Ajax() {
  this.loadXMLHttp = function () {
    var xmlhttp;
    if (window.XMLHttpRequest) {
      // code for IE7+, Firefox, Chrome, Opera, Safari
      xmlhttp=new XMLHttpRequest();
    }

    return xmlhttp;
  };
}

Ajax.prototype.post = function (inParams) {
  var xhr = this.loadXMLHttp();

  xhr.open("POST", inParams.url, true);

  //set headers
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.setRequestHeader("charset", "UTF-8");

  xhr.send(inParams.body);
  return xhr;
};

function Tinning() {
  this.tinningFolderId = null;
  this.configs = [];
  this.tinnedList = [];
  this.tinningVersion = null;
  this.chromeVersion = null;
  this.platform = null;

  chrome.runtime.onInstalled.addListener(function () {
    chrome.tabs.create({url: chrome.runtime.getURL("options.html")});
  });

  // Listen the event of bookmarks in background
  chrome.bookmarks.onMoved.addListener(this._refreshBadge.bind(this));
  chrome.bookmarks.onRemoved.addListener(this._refreshBadge.bind(this));
  chrome.bookmarks.onChanged.addListener(this._refreshBadge.bind(this));
  chrome.bookmarks.onCreated.addListener(this._refreshBadge.bind(this));

  this._refreshBadge();
  this._syncConfig();
  this._registerScrollToLastPositionListener();
}

Tinning.prototype = {
  constructor: Tinning,

  _syncConfig: function () {
    var me = this;
    this.configs = storage.iniConfigs();

    chrome.runtime.getPlatformInfo(function (platformInfo) {
      me.platform = platformInfo.os;
    });

    var userAgent = window.navigator.userAgent.split(" ");
    for (var i = 0; i < userAgent.length; i++) {
      if (userAgent[i].indexOf("Chrome") !== -1) {
        this.chromeVersion = userAgent[i].substr(userAgent[i].indexOf("/") + 1);
        break;
      }
    }

    var manifestObj = chrome.runtime.getManifest();
    this.tinningVersion = manifestObj.version;
  },

  _addTinningFolder: function () {
    var me = this;
    chrome.bookmarks.create({
        "title": "Tinning"
      },
      function(newFolder) {
        me.tinningFolderId = newFolder.id;
      }
    );
  },
  
  _updateBadge: function (bargeText) {
    var bargeOption = {};
    bargeOption.text = bargeText.toString();
    chrome.browserAction.setBadgeText(bargeOption);
  },

  /**
   * Sends an XHR GET request to send out the anonymously usage data. The
   * XHR's 'onload' event is hooks up to the 'showPhotos_' method.
   *
   * @public
   */
  _sendUsageData: function (actionCode, tabCounts) {
    // {"platform": "win","tinning_version":"1.0.0","chrome_version":"1.0.0","action": 0,"number": 10}
    var reqObj = {};
    var now = new Date();
    // 2014-10-22 02:56:17
    var currentTime = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();

    reqObj.platform = this.platform;
    reqObj.chrome_version = this.chromeVersion;
    reqObj.tinning_version = this.tinningVersion;
    reqObj.action = actionCode;
    reqObj.number = tabCounts;
    reqObj.created_at = currentTime;

    var requestBody = "", i = 0;
    for (var key in reqObj){
      requestBody += (key + "=" + reqObj[key]);
      if (i !== 5) {
        requestBody += "&";
      }
      i++;
    }
    var ajax = new Ajax();
    ajax.post({
      url: "http://www.staydan.com/tinning/api/index.php/postUsageData",
      body: requestBody,
      callback: {success: null, failure: null}
    });
  },

  // Callback to tin tabs
  tinningTabs: function (pendingTabs, me, sendResponse) {
    // if continue...
    // Send the count of tabs usage data to server anonymously
    if (storage.retrieveConfigByKey("send-usage-statistics")) {
      this._sendUsageData("0", pendingTabs.length);
    }

    // Create the folder to store the tabs for current window
    chrome.bookmarks.create({
        "parentId": this.tinningFolderId,
        "title": ""
      },
      function(newFolder) {
        function removeTab (tabId) {
          if (storage.retrieveConfigByKey("close-tab-after-tin")) {
            chrome.tabs.remove(tabId);
          }
        };
        try {
          for (var i = pendingTabs.length - 1; i >= 0 ; i--) {
            // Create bookmarks
            chrome.bookmarks.create({
              "parentId": newFolder.id,
              "title": pendingTabs[i].title,
              "url": pendingTabs[i].url
            });

            if (pendingTabs[i].url.indexOf("chrome") === 0) {
              removeTab(pendingTabs[i].id);

              // Chrome options page. It can be tinned, so keep the tabCount.
              pendingTabs.removeAt(i);
            }
          }

          // No satisfied tab need to be tinned
          if (pendingTabs.length === 0) {
            // Refresh the popup
            // me.fetchTinningFolderContent(sendResponse);
          } else {
            // Collect the offset top value for each tab, here we should have no more special tabs.
            // Process all the loading tabs
            for (var k = pendingTabs.length - 1; k >= 0 ; k--) {
              // If scrollToLastPosition is disabled, remove all the tabs.
              // Otherwise, close the tabs which are not complete.
              if (storage.retrieveConfigByKey("scroll-to-the-last-position")) {
                if (pendingTabs[k].status !== "complete") {
                  // console.log(pendingTabs[k].status + " " + pendingTabs[k].url);
                  removeTab(pendingTabs[k].id);
                  pendingTabs.removeAt(k);
                }
              } else {
                  // console.log(pendingTabs[k].status + " " + pendingTabs[k].url);
                  removeTab(pendingTabs[k].id);
                  pendingTabs.removeAt(k);
              }
            }

            if (storage.retrieveConfigByKey("scroll-to-the-last-position")) {
              pendingTabs.asyncEach(function (record, resume) {
                // console.log(record.status + " " + record.url);
                chrome.tabs.executeScript(record.id, {code: "var bodyEle = document.getElementsByTagName('body'); if(bodyEle!== undefined && bodyEle.length>0){bodyEle[0].scrollTop;}"}, function (results) {

                  if (results && results[0] !== 0) {
                    // console.log(results[0] + " " + record.url);
                    storage.addOffsetsItems({url: record.url, top: results[0]});
                  }

                  removeTab(record.id);

                  resume();
                });
              });
            }
          }

          // No need to render the popup again as it will be disappear.
        } catch (e) {
          // console.log(e);
        } finally {
          if (!storage.retrieveConfigByKey("close-tab-after-tin")) {
            me.fetchTinningFolderContent(sendResponse);
          }
        }
      }
    );
  },

  // Re-open the tinned tabs
  unTinningTabs: function (list, folderId, sendResponse) {
    var collectItem = null;

    // Find out the correct folder and remove from the memory
    for (var i = 0; i < list.length; i++) {
      var bookmarkFolder = list[i];
      if (bookmarkFolder.id === folderId) {
        collectItem = bookmarkFolder;

        // Enabled: Send the count of tabs usage data to server anonymously
        if (storage.retrieveConfigByKey("send-usage-statistics")) {
          this._sendUsageData("1", collectItem.item.length);
        }

        list.removeAt(i);
        break;
      }
    }

    // Recover the tabs
    var urls = [];

    if (collectItem !== null) {
      // if open in new window, collect urls, otherwise, open them in current window
      collectItem.item.forEach(function (tab) {
        if (storage.retrieveConfigByKey("open-tabs-in-new-window")) {
          urls.push(tab.url);
        } else {
          chrome.tabs.create({url: tab.url, active: false});
        }
      });

      // Enabled: open all the tabs in a new window
      if (urls.length > 0 && storage.retrieveConfigByKey("open-tabs-in-new-window")) {
        chrome.windows.create({url: urls, focused: true, incognito: false});
      }

      sendResponse(folderId);
    }
  },

  _refreshBadge: function () {
    var me = this;
    chrome.bookmarks.getSubTree("2",
      function(bookmarkTreeNodes) {
        var otherBookmarks = bookmarkTreeNodes[0].children;
        var appearAt = otherBookmarks.contains({title: "Tinning"}, ["title"]);
        if (appearAt === -1) {
          me._addTinningFolder();
          me._updateBadge(0);
        } else {
          me.tinningFolderId = otherBookmarks[appearAt].id;
          me._updateBadge(otherBookmarks[appearAt].children.length);
        }
      }
    );
  },
  
  // Fetch all the bookmarks in the tinning folder
  fetchTinningFolderContent: function (sendResponse) {
    var me = this;
    chrome.bookmarks.getSubTree(me.tinningFolderId,
      function(bookmarkTreeNodes) {
        var tinnedListItem = [];
        me.tinnedList = [];
        var tinningBookmarks = bookmarkTreeNodes[0].children;
        // Iterate Tinning folder
        for (var i = 0; i < tinningBookmarks.length; i++) {
          var tinned = tinningBookmarks[i];
          tinnedListItem = [];
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
          me.tinnedList.push({item: tinnedListItem, id: tinned.id, title: tinned.title});
        }

        sendResponse(me.tinnedList);
      }
    );
  },
  _registerScrollToLastPositionListener: function () {
    if (storage.retrieveConfigByKey("scroll-to-the-last-position")) {
      chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        // Collect the offset top value for each tab, give up if the page is not normal
        if (tab.status === "complete" && tab.url.indexOf("chrome") !== 0) {
          var savedOffset = storage.fetchOffsetsByUrl(tab.url);
          if (savedOffset !== null && savedOffset.top !== 0) {
            chrome.tabs.executeScript(tabId, {code: "document.getElementsByTagName('body')[0].scrollTop=" + savedOffset.top}, function (results) {
              storage.removeOffsetsByUrls([tab.url]);
            });
          }
        }
      });
    }
  }  
};

function entryPoint () {
  var tinning = new Tinning();

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      switch (request.type) {
        case "tin": 
          tinning.tinningTabs(request.tabs, tinning, function(list) {
            sendResponse({tinnedList: list});
          });
          return true;
          break;
        case "untin":
          tinning.unTinningTabs(request.list, request.folder_id, function(id) {
            sendResponse({removedFolderId: id});
          });
          return true;
          break;
        case "fetchList":
          tinning.fetchTinningFolderContent(function(list) {
            sendResponse({tinnedList: list});
          });
          // To indicate you wish to send a response asynchronously 
          // This will keep the message channel open to the other end until sendResponse is called
          return true;
          break;
        default: 
          break;
      }
    }
  );
}


entryPoint();