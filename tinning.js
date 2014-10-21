/*global chrome: false, storage: false, console: false, IScroll: false, Handlebars: false, $: false */
"use strict";

// Copyright (c) 2014 Zhu Meng Dan(Daniel). All rights reserved.

Array.prototype.removeAt = function (index) {
  if (this.length > index) {
    this.splice(index, 1);
  }
  return this;
};

Array.prototype.contains = function (item, compareFields) {
  var appearAt = -1;

  if (this.length === 0) return appearAt; 
  this.filter(function (value, index, element) {
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

var tinning = {
   tinningFolderId: null,
   configs: [],
   tinnedList: [],
   scrolling: false,
   myScroll: null,
   iconScroller: null,

  updateBadge: function (bargeText) {
    var bargeOption = {};
    bargeOption.text = bargeText.toString();
    chrome.browserAction.setBadgeText(bargeOption);
  },

  collectTabs: function () {
    chrome.tabs.query({"currentWindow": true}, this.tinningTabs);
  },

  // Callback to tin tabs
  tinningTabs: function (tabs) {
    // Create the folder to store the tabs for current window
    chrome.bookmarks.create({
        "parentId": tinning.tinningFolderId,
        "title": ""
      },
      function(newFolder) {
        var offsetList = [];

        var totalTabsSize = tabs.length;
        tabs.forEach(function (record) {

          // Collect the offset top value for each tab, give up if the page is not normal
          if (record.url.indexOf("chrome") !== 0) {
            chrome.tabs.executeScript(record.id, {code: "document.getElementsByTagName('body')[0].scrollTop;"}, function (results) {
              var offsetListItem = {};
              if (results === undefined) {
                totalTabsSize--;
              } else {
                offsetListItem.title = record.title;
                offsetListItem.url = record.url;
                offsetListItem.top = results[0];
                offsetList.push(offsetListItem);
                if (offsetList.length === totalTabsSize) {
                  storage.addOffsetsItems(offsetList);
                }
              }
            });
          } else {
            totalTabsSize--;
          }
        });

        for (var i = 0; i < tabs.length; i++) {
          var tab = tabs[i];

          // Create bookmarks
          chrome.bookmarks.create({
            "parentId": newFolder.id,
            "title": tab.title,
            "url": tab.url
          });

          // Close the tabs after tin or not
          if (storage.retrieveConfigByKey("close-tab-after-tin")) {
            chrome.tabs.remove(tab.id);
          }
        }

        // Refresh the popup
        tinning.fetchTinningFolderContent();
      }
    );
  },

  unTinningTabs: function (folderId, el) {
    var collectItem = null;

    // Find out the correct folder and remove from the memory
    for (var i = 0; i < tinning.tinnedList.length; i++) {
      var bookmarkFolder = tinning.tinnedList[i];
      if (bookmarkFolder.item.id === folderId) {
        collectItem = bookmarkFolder;
        tinning.tinnedList.removeAt(i);
        break;
      }
    }

    // Recover the tabs
    var tabOptions = {};

    // Enabled: open all the tabs in a new window
    if (storage.retrieveConfigByKey("open-tabs-in-new-window")) {
      chrome.windows.create({focused: true, incognito: false}, function (window) {
        tabOptions.windowId = window.id;
        collectItem.item.forEach(function (tab) {
          tabOptions.url = tab.url;
          chrome.tabs.create(tabOptions, function (createdTab) {
            // Scroll to last position or not

          });
        });
      });
    } else {
      collectItem.item.forEach(function (tab) {
        tabOptions.url = tab.url;
        chrome.tabs.create(tabOptions, function (createdTab) {
          // Scroll to last position or not

        });
    });
    }

    tinning.tinnedList.removeAt(folderId);

    // Remove the related bookmarks
    chrome.bookmarks.removeTree(collectItem.item.id, function () {
      el.delay(100).fadeOut(500);
      el.animate({
          "opacity" : "0",
        },{
        "complete" : function() {
          el.remove();
        }
      });
    });
  },
  registerScrollToLastPositionListener: function () {
    if (storage.retrieveConfigByKey("scroll-to-the-last-position")) {
      chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (tab.status === "complete") {
          var savedOffset = storage.fetchOffsetsByUrlAndTitle(tab.url, tab.title);
          if (savedOffset) {
            chrome.tabs.executeScript(tabId, {code: "document.getElementsByTagName('body')[0].scrollTop=" + savedOffset.top}, function (results) {
              console.log(tab.title + " scroll to last position completed.");
            });
          }
        }
      });
    }
  },
  // Sync
  syncTinningFolder: function (fetchTinningContentFlag) {
    chrome.bookmarks.getSubTree("2",
      function(bookmarkTreeNodes) {
        var otherBookmarks = bookmarkTreeNodes[0].children;
        var appearAt = otherBookmarks.contains({title: "Tinning"}, ["title"]);
        if (appearAt === -1) {
          tinning.updateBadge(0);
        } else {
          tinning.tinningFolderId = otherBookmarks[appearAt].id;
          tinning.updateBadge(otherBookmarks[appearAt].children.length);
        }
        // for (var i = 0; i < otherBookmarks.length; i++) {
        //   if (otherBookmarks[i].title === "Tinning") {
        //     tinning.tinningFolderId = otherBookmarks[i].id;
        //     tinning.updateBadge(otherBookmarks[i].children.length);
        //     // break;
        //   }
        // }

        if (tinning.tinningFolderId === null) {
          tinning.addTinningFolder();
        } else {
          if (fetchTinningContentFlag) {
            tinning.fetchTinningFolderContent();
          }
        }
      }
    );
  },

  // Fetch all the bookmarks in the tinning folder
  fetchTinningFolderContent: function () {
    chrome.bookmarks.getSubTree(tinning.tinningFolderId,
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
          tinning.tinnedList.push({"item": tinnedListItem});
        }

        tinning.renderPopup();
      }
    );
  },

  renderPopup: function () {
    var tpl,
        displayMode = storage.retrieveConfigByKey("display_mode");

    $("#wrapper").html("");

    if (tinning.myScroll) {
      tinning.myScroll.refresh();
    }

    if (displayMode === "grid") {
      // Using jQuery to fetch the template
      tpl = $("#tab-collection-grid-tpl").html();
    } else if (displayMode === "list") {
      tpl = $("#tab-collection-list-tpl").html();
    }
    // Precompile the template
    var template = Handlebars.compile(tpl);

    // Match the data
    var html = template({"tinnedList": tinning.tinnedList});

    // Render the html
    $("#wrapper").html(html);

    $("#wrapper").fadeIn(300);

    tinning.myScroll = new IScroll("#wrapper", {
      scrollbars: true,
      mouseWheel: true,
      interactiveScrollbars: true,
      shrinkScrollbars: "scale",
      fadeScrollbars: true
    });

    tinning.myScroll.refresh();

    tinning.myScroll.on("scrollStart", function (){
      tinning.scrolling = true;
      setTimeout(function () {
        console.log("scrollStart...");
        tinning.scrolling = true;
      }, 100);
    });
    tinning.myScroll.on("scrollEnd", function () {
      setTimeout(function () {
        console.log("scrollEnd...");
        tinning.scrolling = false;
      }, 50);
    });

    $(".icon-wrapper img")
      .hover(function (element) {
        var leftDis = element.currentTarget.x - $("#icon-tooltips-popover").width() / 2;
        $("#icon-tooltips-popover").css("left", leftDis > 0 ? leftDis : 0);
        $("#icon-tooltips-popover").css("top", element.currentTarget.y + element.currentTarget.height + 10);

        var iconTooltipsSource = "<div class='popover-detail'>{{title}}</div>";
        var iconTooltipsTemplate = Handlebars.compile(iconTooltipsSource);
        var context = {title: $(this).attr("tip")}
        var html = iconTooltipsTemplate(context);
        
        $("#icon-tooltips-popover").html(html);
        $("#icon-tooltips-popover").fadeIn("fast");
      })
      .mouseleave(function () {
        $("#icon-tooltips-popover").hide();
      });

    $("#scroller > ul > li")
      .mouseenter(function () {
        $(this).addClass("hover");
        $(this).children().find(".tabs-tools").fadeIn("fast");
      })
      .mouseleave(function () {
        $(this).removeClass("hover");
        $(this).children().find(".tabs-tools").fadeOut("fast");
      })
      .click(function (e) {
        if (!tinning.scrolling && e.target.type !== "textarea") {
          console.log("clicked...");
          var folderId = $(this).attr("folderid");
          tinning.unTinningTabs(folderId, $(this));
        }
      });

    $("#scroller > ul > li .tabs-tools")
      .mouseenter(function () {
        $(this).addClass("rotate-loading");
      })
      .mouseleave(function () {
        $(this).removeClass("rotate-loading");
      })
      .click(function (e) {
        console.log("Tool clicked...");

        // Use event.stopPropagation() to prevents the event from bubbling up the DOM tree.
        e.stopPropagation();
        var pendingRemoveLi = $(this).parent().parent();
        var folderId = $(this).attr("folderid");
        var collectItem = null;

        for (var i = 0; i < tinning.tinnedList.length; i++) {
          var bookmarkFolder = tinning.tinnedList[i];
          if (bookmarkFolder.item.id === folderId) {
            collectItem = bookmarkFolder;
            tinning.tinnedList.removeAt(i);
            break;
          }
        }

        if (collectItem !== null) {
          // Prepare the urls to be removed
          var tobeRemoveUrls = [];
          collectItem.item.forEach(function (item) {
            tobeRemoveUrls.push(item.url);
          });

          // Remove the real bookmarks
          chrome.bookmarks.removeTree(folderId, function () {
            storage.removeOffsetsByUrls(tobeRemoveUrls);

            // Remove this item on popup
            pendingRemoveLi.delay(100).fadeOut(500);
            pendingRemoveLi.animate({
                "opacity" : "0",
              },{
              "complete" : function() {
                pendingRemoveLi.remove();
              }
            });
          });
        }
      });

    $("#scroller > ul > li textarea")
      .focusout(function (e) {
        var value = e.currentTarget.value;
        var folderId = $(this).attr("folderid");

        // Update the folder name
        chrome.bookmarks.update(folderId, {"title": value});
      });
  },
  addTinningFolder: function () {
    chrome.bookmarks.create({
        "title": "Tinning"
      },
      function(newFolder) {
        tinning.tinningFolderId = newFolder.id;
      }
    );
  },
  onRemoveBookmarks: function () {
    tinning.syncTinningFolder(false);
  },

  onCreatedBookmarks: function () {
    tinning.syncTinningFolder(false);
  },

  onOptionClicked: function (element) {
    var margin = 10;
    // Popopver bottom
    $("#option-arrow").toggleClass("arrow-rotate");
    $("#option-popover").css("left", element.currentTarget.x - $("#option-popover").width() / 2);
    $("#option-popover").css("top", element.currentTarget.y + element.currentTarget.height + margin);

    if ($("#option-arrow").hasClass("arrow-rotate")) {
      $("#option-popover").fadeIn();
    } else {
      $("#option-popover").fadeOut();
    }
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
    $("#tin-tabs").click(function () {
      tinning.collectTabs();
    });

    $("#option-arrow").click(function (element) {
      tinning.onOptionClicked(element);
    });

    $("#display-mode .radio-item").click(function () {
      var displayMode = $("#display-mode .radio-slider").hasClass("radio-slider-move");
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", !displayMode);
      storage.setConfigValueByKey("display_mode", (!displayMode ? "grid" : "list"));
      tinning.fetchTinningFolderContent();
    });

    document.addEventListener("touchmove", function (e) { e.preventDefault(); }, false);
  }
};