/*global $:false */
/*global storage:false */
"use strict";

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
$(document).ready(function(){

  var optionsArray = [
    {
       radio_id: "display-mode",
       label: "Display Mode",
       radio_label_left: "Grid",
       radio_label_right: "List",
       tooltips: "Display mode in popup page: Grid or List."
    },
    {
       radio_id: "close-tab-after-tin",
       label: "Close Tab After Tin",
       radio_label_left: "Yes",
       radio_label_right: "No",
       tooltips: "We will close all the tabs in the chrome window as soon as you tin them."
    },
    {
       radio_id: "open-tabs-in-new-window",
       label: "Open Tabs In New Window",
       radio_label_left: "Yes",
       radio_label_right: "No",
       tooltips: "If enabled, all the tabs will be open in a totally new Google Chrome window."
    },
    {
       radio_id: "send-usage-statistics",
       label: "Automatically send usage statistics",
       radio_label_left: "Yes",
       radio_label_right: "No",
       tooltips: "If enabled, it will send anonymous data to the remote server in the background, such as the version of your Google Chrome, the version of Tinning, operation platform and the total numbers of tinned and un-tinned tabs. We will not collect your personal data."
    },
    {
       radio_id: "scroll-to-the-last-position",
       label: "Scroll to the last position after un-Tin tabs",
       radio_label_left: "Yes",
       radio_label_right: "No",
       tooltips: "If enabled, the page which was tinned to Tinning will scroll to the last position when you open it again."
    }
  ];

  var renderOptionPage = function () {
    // Using jQuery to fetch the template
    var tpl = $("#option-radio-tpl").html();

    $("#alternative-panel").html("");

    // Precompile the template
    var template = Handlebars.compile(tpl);

    var alternativePanelHtml = "";
    for (var i = 0; i < optionsArray.length; i++) {
      // Match the data
      var simpleHtml = template(optionsArray[i]);
      alternativePanelHtml += simpleHtml;
    };

    // Render the html
    $("#alternative-panel").html(alternativePanelHtml);

    var manifestObj = chrome.runtime.getManifest();
    
    $(".tinning-info").html(manifestObj.version);

    registerEvents();
    syncConfig();
  };
  var setResponseMsg = function (msg, successFlag) {
    $('.feedback-message').html(msg);
    $('.feedback-message').toggleClass('failure', !successFlag);
    $('.feedback-message').toggleClass('success', successFlag);
  };
  var sendFeedback = function () {
    var reqObj = {};
    reqObj.mail = $('.mailBox').val();
    reqObj.feedback = $('.commentBox').val();

    if (reqObj.mail.length === 0 || reqObj.feedback.length === 0) {
      setResponseMsg("Sorry! Please fill in both fields.", false);
    } else {
      $.ajax({
        url: "http://www.staydan.com/tinning/api/index.php/addFeedback",
            type:'Post',
            data:JSON.stringify(reqObj),
            dataType:'json',
            cache:false,
        success : function(obj) {
          var state = obj.result;
          if(state === "Success"){
            setResponseMsg("Thanks for your feedback, I'll read it in detail and reply you ASAP!", true);
          } else {
            var errorMsg = obj.errorMsg;
            setResponseMsg("Sorry! " + errorMsg, false);
          }
        },
        error: function(){
          setResponseMsg("Sorry! Something wrong happened, it's definitely my mistake.", false);
        }
      });
    }
  };

  var syncConfig = function () {
    var configs = storage.iniConfigs();

    if (configs.display_mode === "grid") {
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", true);
    } else if (configs.display_mode === "list") {
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", false);
    }

    $("#open-tabs-in-new-window .radio-slider").toggleClass("radio-slider-move", configs["open-tabs-in-new-window"]);
    $("#close-tab-after-tin .radio-slider").toggleClass("radio-slider-move", configs["close-tab-after-tin"]);
    $("#send-usage-statistics .radio-slider").toggleClass("radio-slider-move", configs["send-usage-statistics"]);
    $("#scroll-to-the-last-position .radio-slider").toggleClass("radio-slider-move", configs["scroll-to-the-last-position"]);
  };

  var registerEvents = function () {
    $("#display-mode .radio-item").click(function () {
      var displayMode = $("#display-mode .radio-slider").hasClass("radio-slider-move");
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", !displayMode);
      storage.setConfigValueByKey("display_mode", (!displayMode ? "grid" : "list"));
    });

    $("#open-tabs-in-new-window .radio-item").click(function () {
      var openTabsInNewWindow = $("#open-tabs-in-new-window .radio-slider").hasClass("radio-slider-move");
      $("#open-tabs-in-new-window .radio-slider").toggleClass("radio-slider-move", !openTabsInNewWindow);
      storage.setConfigValueByKey("open-tabs-in-new-window", !openTabsInNewWindow);
    });

    $("#close-tab-after-tin .radio-item").click(function () {
      var closeTabAfterTin = $("#close-tab-after-tin .radio-slider").hasClass("radio-slider-move");
      $("#close-tab-after-tin .radio-slider").toggleClass("radio-slider-move", !closeTabAfterTin);
      storage.setConfigValueByKey("close-tab-after-tin", !closeTabAfterTin);
    });

    $("#send-usage-statistics .radio-item").click(function () {
      var closeTabAfterTin = $("#send-usage-statistics .radio-slider").hasClass("radio-slider-move");
      $("#send-usage-statistics .radio-slider").toggleClass("radio-slider-move", !closeTabAfterTin);
      storage.setConfigValueByKey("send-usage-statistics", !closeTabAfterTin);
    });

    $("#scroll-to-the-last-position .radio-item").click(function () {
      var scrollToLastPosition = $("#scroll-to-the-last-position .radio-slider").hasClass("radio-slider-move");
      $("#scroll-to-the-last-position .radio-slider").toggleClass("radio-slider-move", !scrollToLastPosition);
      storage.setConfigValueByKey("scroll-to-the-last-position", !scrollToLastPosition);
    });
    $("#feedback-btn").click(function (element) {
      // Real height including padding
      var marginTop = $(window).height() - $("#alternative-panel").offset().top - $("#alternative-panel")[0].clientHeight;
      $("#feedback-container").css("margin-top", marginTop);

      $("#feedback-container").show();

      $("body").animate({
        scrollTop : $(window).height(),
      }, {
        "duration": 800
      });
    });

    $("#setting-btn").click(function (element) {
      $("body").animate({
        scrollTop : 0,
      }, {
        "duration": 800,
        "complete" : function() {
          $("#feedback-container").fadeOut(200);
        }
      });
    });

    $(".feedback-submit-btn").click(function () {
      sendFeedback();
    });

    $("#donate-btn").hover(
      function (element) {
        $("#donate-popover").css("left", element.currentTarget.offsetLeft + element.currentTarget.offsetWidth / 2 - $("#donate-popover").width() / 2);
        $("#donate-popover").css("bottom", $(window).height() - element.currentTarget.offsetTop);
        $("#donate-popover").fadeIn();

        if ($(".donate-approach").html() === "") {
          $(".donate-popover-selection > ul > li:first-child").addClass("hover");
          $(".donate-approach").html($("#donate-paypal-tpl").html());
        }
      }
    );

     $("#donate-popover").hover(
        function () {},
        function (element) {
          $("#donate-popover").fadeOut();
        }
      );

    $(".donate-popover-selection > ul > li").hover(
        function () {
          var childLiElements = $(this).parent().children();

          for (var i = 0; i < childLiElements.length; i++) {
            if (childLiElements[i].innerText !== "|") {
              if (childLiElements[i].innerText === $(this)[0].innerText) {
                childLiElements[i].className = "hover";
                var tpl = $("#donate-" + $(this)[0].innerText.toLowerCase() + "-tpl").html();

                $(".donate-approach").html(tpl);
              } else {
                childLiElements[i].className = "";
              }
            }
          };
        },
        function () {

        }
      );

    $(".radio-button").hover(
      function (element) {
        var leftDis = $("body").offset().left + element.currentTarget.offsetLeft + element.currentTarget.offsetWidth + 5;
        $("#option-tooltips-popover").css("left", leftDis > 0 ? leftDis : 0);
        $("#option-tooltips-popover").css("top", element.currentTarget.offsetTop + $("#alternative-panel").offset().top);

        var iconTooltipsSource = "<div class='popover-detail'>{{title}}</div>";
        var iconTooltipsTemplate = Handlebars.compile(iconTooltipsSource);
        var appearAt = optionsArray.contains({radio_id:  $(this).attr("id")}, ["radio_id"]);
        if (appearAt !== -1) {
          var context = {title: optionsArray[appearAt].tooltips};
          var html = iconTooltipsTemplate(context);
          
          $("#option-tooltips-popover").html(html);
          $("#option-tooltips-popover").show();
        }
      },
      function () {
        $("#option-tooltips-popover").hide();
        $("#option-tooltips-popover").html("");
      }
    );
  };

  renderOptionPage();
});