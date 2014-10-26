Array.prototype.removeAt = function (index) {
  if (this.length > index) {
    this.splice(index, 1);
  }
  return this;
};

var myScroll = null;

$(document).ready(function(){
  var tinnedList;

  removeTab = function (tabId) {
    if (storage.retrieveConfigByKey("close-tab-after-tin")) {
      chrome.tabs.remove(tabId);
    }
  };

  registerInitEvent = function () {
    var me = this;
    
    this.registerTinAction();

    $("#setting-tabs").click(function () {
      chrome.tabs.create({url: chrome.runtime.getURL("options.html")});
    });

    $(".mask").click(function () {
      $("#option-popover").fadeOut();
      $(".mask").fadeOut();
      $("#option-arrow").toggleClass("arrow-rotate", false);
    });

    $(".button").hover(
      function () {
        $(this).addClass("hover");
      }, function () {
        $(this).removeClass("hover");
      }
    );

    $("#option-arrow").click(function (element) {
      onOptionClicked(element);
    });

    $("#display-mode .radio-item").click(function () {
      var displayMode = $("#display-mode .radio-slider").hasClass("radio-slider-move");
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", !displayMode);
      storage.setConfigValueByKey("display_mode", (!displayMode ? "grid" : "list"));
      retrieveTinnedList();
    });

    document.addEventListener("touchmove", function (e) { e.preventDefault(); }, false);
  };

  // The option popover.
  onOptionClicked = function (element) {
    var margin = 10;

    $("#setting-tabs").html(chrome.i18n.getMessage("setting"));

    $("#option-arrow").toggleClass("arrow-rotate");

    var leftDis = element.currentTarget.x + element.currentTarget.width + margin;
    $("#option-popover").css("left", leftDis > 0 ? leftDis : 0);
    $("#option-popover").css("top", element.currentTarget.y);

    if ($("#option-arrow").hasClass("arrow-rotate")) {
      $("#option-popover").fadeIn();
      $(".mask").fadeIn();
    } else {
      $("#option-popover").fadeOut();
      $(".mask").fadeOut();
    }
  };

  retrieveTinnedList = function () {
    var me = this;
    chrome.runtime.sendMessage({type: "fetchList"}, function(response) {
      // console.log(JSON.stringify(response.tinnedList));
      me.tinnedList = response.tinnedList;
      me.renderPopup(response.tinnedList, me);
    });
  };

  renderPopup = function (tinnedList, context) {
    var tpl,
        context = context,
        displayMode = storage.retrieveConfigByKey("display_mode");

    $("#scroller").html("");

    if (displayMode === "grid") {
      // Using jQuery to fetch the template
      tpl = $("#tab-collection-grid-tpl").html();
    } else if (displayMode === "list") {
      tpl = $("#tab-collection-list-tpl").html();
    }
    // Precompile the template
    var template = Handlebars.compile(tpl);

    // Match the data
    var html = template({"tinnedList": tinnedList});

    // Render the html
    $("#scroller").html(html);

    // if (context.myScroll === null) {
      context.updateScroll(context);

      context.registerUnTinAction(context);

      context.registerScrollEvent(context);

      context.registerIconTooltip(context);

      context.registerScrollItemOptionEvent(tinnedList, context);
    // }
  };

  registerUnTinAction = function (context) {
    // un-Tin tabs
    $("#scroller > ul > li").on("tap", function (el) {
      el.stopPropagation();
      if (el.target.type !== "textarea") {
        console.log("clicked");
        var element = $(this);
        var folderId = element.attr("folderid");
        chrome.runtime.sendMessage({type: "untin", list: context.tinnedList, folder_id: folderId}, function(response) {
          console.log(response.removedFolderId);
          // Remove the related li element
          chrome.bookmarks.removeTree(response.removedFolderId, function () {
            element.delay(100).fadeOut(200);
            element.animate({
                "opacity" : "0",
              },{
                "complete" : function() {
                  element.remove();
                }
              });
            });
          });
        }
      });
  },

  registerTinAction = function () {
    var me = this;
    $("#tin-tabs").click(function () {
      chrome.tabs.query({currentWindow: true}, function (tabs){
        // Remain at least one new tab to prevent the window auto close
        if (storage.retrieveConfigByKey("close-tab-after-tin")) {
          chrome.tabs.create({active: false});
        }

        // Clear the empty tabs
        // Don't use forEach here, because it will mess the array up after removeAt.
        for (var i = tabs.length - 1; i >= 0 ; i--) {
          if (tabs[i].url === "chrome://newtab/") {
            removeTab(tabs[i].id);
            tabs.removeAt(i);
          }
        }
        // All the empty tabs should be removed so far
        
        // No satisfied tab need to be tinned
        if (tabs.length === 0) return;

        chrome.runtime.sendMessage({type: "tin", tabs: tabs}, function(response) {
          me.tinnedList = response.tinnedList;
          me.renderPopup(response.tinnedList, me);
        });
      });
    });
  },

  registerScrollItemOptionEvent = function (tinnedList, context) {
    $("#scroller > ul > li .tabs-tools")
      .mouseenter(function () {
        $(this).addClass("rotate-loading");
      })
      .mouseleave(function () {
        $(this).removeClass("rotate-loading");
      })
      .on("tap", function (e) {
        // Use event.stopPropagation() to prevents the event from bubbling up the DOM tree.
        e.stopPropagation();
        var pendingRemoveLi = $(this).parent().parent();
        var folderId = $(this).attr("folderid");
        var collectItem = null;

        for (var i = 0; i < tinnedList.length; i++) {
          var bookmarkFolder = tinnedList[i];
          if (bookmarkFolder.id === folderId) {
            collectItem = bookmarkFolder;
            tinnedList.removeAt(i);
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
            pendingRemoveLi.delay(100).fadeOut(300);
            pendingRemoveLi.animate({
                "opacity" : "0",
              },{
              "complete" : function() {
                pendingRemoveLi.remove();
                context.myScroll.refresh();
              }
            });
          });
        }
      });
  },
  registerIconTooltip = function  (context) {
    $(".icon-wrapper img").hover(
      function (element) {
        if ($(this).attr("tip") !== "") {
          var leftDis = element.clientX - $("#icon-tooltips-popover").width() / 2;
          $("#icon-tooltips-popover").css("left", leftDis > 0 ? leftDis : 0);
          $("#icon-tooltips-popover").css("top", element.clientY + 10);

          var iconTooltipsSource = "<div class='popover-detail'>{{title}}</div>";
          var iconTooltipsTemplate = Handlebars.compile(iconTooltipsSource);
          var context = {title: $(this).attr("tip")};
          var html = iconTooltipsTemplate(context);

          $("#icon-tooltips-popover").html(html);
          $("#icon-tooltips-popover").show();
        }
      },
      function () {
        $("#icon-tooltips-popover").hide();
        $("#icon-tooltips-popover").html("");
      }
    );
  },

  registerScrollEvent = function (context) {
    $("#scroller > ul > li").hover(
        function () {
          $(this).addClass("hover");
          $(this).children().find(".tabs-tools").fadeIn("fast");
        },
        function () {
          $(this).removeClass("hover");
          $(this).children().find(".tabs-tools").fadeOut("fast");
        }
      );

    $("#scroller > ul > li textarea")
      .keyup(function (e) {
        var value = e.currentTarget.value;
        var folderId = $(this).attr("folderid");

        // Update the folder name
        chrome.bookmarks.update(folderId, {"title": value});
      });
  },

  updateScroll = function (context) {
    if (context.myScroll === null) {
      context.myScroll = new IScroll("#wrapper", {
        scrollbars: true,
        tap: true,
        mouseWheel: true,
        interactiveScrollbars: true,
        shrinkScrollbars: "scale",
        fadeScrollbars: true
      });

      context.myScroll.on("scrollStart", function () {
        console.log("start");
      });
      context.myScroll.on("scrollEnd", function () {
        console.log("end");
      });
    }

    context.myScroll.refresh();
  },

  syncConfig = function () {
    this.configs = storage.iniConfigs();

    if (this.configs.display_mode === "grid") {
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", true);
    } else if (this.configs.display_mode === "list") {
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", false);
    }
  };

  // Sync the configs
  syncConfig();
  
  // Register all the event first.
  registerInitEvent();

  // Render the popup page.
  retrieveTinnedList();
});