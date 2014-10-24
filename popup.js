Array.prototype.removeAt = function (index) {
  if (this.length > index) {
    this.splice(index, 1);
  }
  return this;
};

$(document).ready(function(){
  console.log("ready ");

  var scrolling = false,
      myScroll = null;

  removeTab = function (tabId) {
    if (storage.retrieveConfigByKey("close-tab-after-tin")) {
      chrome.tabs.remove(tabId);
    }
  };

  registerEvent = function () {
    $("#tin-tabs").click(function () {
      chrome.tabs.query({currentWindow: true}, function (tabs){
        // Remain at least one new tab to prevent the window auto close
        chrome.tabs.create({active: false});

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
          me.renderPopup(response.tinnedList);
        });
      });
    });

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
    // Popopver bottom
    $("#option-arrow").toggleClass("arrow-rotate");

    var leftDis = element.currentTarget.x + element.currentTarget.width + margin;
    $(".popover.right").css("left", leftDis > 0 ? leftDis : 0);
    $(".popover.right").css("top", element.currentTarget.y);

    if ($("#arrowDnow").hasClass("arrow-rotate")){
      $(".popover.right").fadeIn();
    } else {
      $(".popover.right").fadeOut();
    }

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
      me.renderPopup(response.tinnedList);
    });
  };

  renderPopup = function (tinnedList) {
    var tpl,
        displayMode = storage.retrieveConfigByKey("display_mode");

    $("#wrapper").html("");

    if (this.myScroll) {
      this.myScroll.refresh();
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
    var html = template({"tinnedList": tinnedList});

    // Render the html
    $("#wrapper").html(html);

    $("#wrapper").fadeIn(300);

    this.myScroll = new IScroll("#wrapper", {
      scrollbars: true,
      mouseWheel: true,
      interactiveScrollbars: true,
      shrinkScrollbars: "scale",
      fadeScrollbars: true
    });

    this.myScroll.refresh();

    this.myScroll.on("scrollStart", function (){
      this.scrolling = true;
      setTimeout(function () {
        this.scrolling = true;
      }, 100);
    });
    this.myScroll.on("scrollEnd", function () {
      setTimeout(function () {
        this.scrolling = false;
      }, 50);
    });

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

      // un-Tin tabs
    $("#scroller > ul > li").click(function (e) {
      if (!this.scrolling && e.target.type !== "textarea") {
        var element = $(this);
        var folderId = element.attr("folderid");
        chrome.runtime.sendMessage({type: "untin", folder_id: folderId}, function(response) {
          console.log(response);
          // Remove the related li element
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
          });
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
        // Use event.stopPropagation() to prevents the event from bubbling up the DOM tree.
        e.stopPropagation();
        var pendingRemoveLi = $(this).parent().parent();
        var folderId = $(this).attr("folderid");
        var collectItem = null;

        for (var i = 0; i < tinnedList.length; i++) {
          var bookmarkFolder = tinnedList[i];
          if (bookmarkFolder.item.id === folderId) {
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
            pendingRemoveLi.delay(100).fadeOut(500);
            pendingRemoveLi.animate({
                "opacity" : "0",
              },{
              "complete" : function() {
                pendingRemoveLi.remove();
                this.myScroll.refresh();
              }
            });
          });
        }
      });

    $("#scroller > ul > li textarea")
      .keyup(function (e) {
        var value = e.currentTarget.value;
        var folderId = $(this).attr("folderid");

        // Update the folder name
        chrome.bookmarks.update(folderId, {"title": value});
      });
  };

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
  registerEvent();

  // Render the popup page.
  retrieveTinnedList();
});