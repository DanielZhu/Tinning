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

  var optionsRadioButtonArray = [
    {
       radio_id: "display-mode",
       label: chrome.i18n.getMessage("displayMode"),
       radio_label_left: "res/grid.png",
       radio_label_right: "res/list.png",
       tooltips: chrome.i18n.getMessage("displayModeTooltips")
    }
  ];
  var toggleButtonArray = [
    {
       toggle_id: "close-tab-after-tin",
       label: chrome.i18n.getMessage("closeTabAfterTin"),
       tooltips: chrome.i18n.getMessage("closeTabAfterTinTooltips")
    },
    {
       toggle_id: "open-tabs-in-new-window",
       label: chrome.i18n.getMessage("openTabsInNewWindow"),
       tooltips: chrome.i18n.getMessage("openTabsInNewWindowTooltips")
    },
    {
       toggle_id: "send-usage-statistics",
       label: chrome.i18n.getMessage("automaticallySendUsageStatistics"),
       tooltips: chrome.i18n.getMessage("automaticallySendUsageStatisticsTooltips")
    },
    {
       toggle_id: "scroll-to-the-last-position",
       label: chrome.i18n.getMessage("scrollToTheLastPositionAfterUnTinTabs"),
       tooltips: chrome.i18n.getMessage("scrollToTheLastPositionAfterUnTinTabsTooltips")
    }
  ];

  var renderOptionPage = function () {
    // Using jQuery to fetch the template
    var optionRadiosTpl = $("#option-radio-tpl").html();
    var toggleTpl = $("#toggle-radio-tpl").html();

    $("#alternative-panel").html("");

    // Precompile the template
    var optionRadiosTemplate = Handlebars.compile(optionRadiosTpl);
    var toggleTemplate = Handlebars.compile(toggleTpl);

    var alternativePanelHtml = "";
    for (var i = 0; i < optionsRadioButtonArray.length; i++) {
      // Match the data
      var html = optionRadiosTemplate(optionsRadioButtonArray[i]);
      alternativePanelHtml += html;
    };

    for (var i = 0; i < toggleButtonArray.length; i++) {
      // Match the data
      var html = toggleTemplate(toggleButtonArray[i]);
      alternativePanelHtml += html;
    };

    // Render the html
    $("#alternative-panel").html(alternativePanelHtml);

    var manifestObj = chrome.runtime.getManifest();
    
    $(".tinning-info").html(manifestObj.version);

    $(".donate-thanks").html(chrome.i18n.getMessage("thanksFeedback"));
    $("#donate-btn").html(chrome.i18n.getMessage("donate"));
    $("#feedback-btn").html(chrome.i18n.getMessage("feedback"));
    $(".provide-feedback").html(chrome.i18n.getMessage("provideFeedback"));
    $("#setting-btn").html(chrome.i18n.getMessage("setting"));
    $(".mail-address").html(chrome.i18n.getMessage("mailAddress"));
    $(".feedback_msg").html(chrome.i18n.getMessage("feedback"));
    $(".feedback-submit-btn").html(chrome.i18n.getMessage("sendFeedback"));

    $("#donate-paypal").html(chrome.i18n.getMessage("paypal"));
    $("#donate-wechat").html(chrome.i18n.getMessage("wechat"));
    $("#donate-alipay").html(chrome.i18n.getMessage("alipay"));

    $("title").html(chrome.i18n.getMessage("optionHtmlTitle"));

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
    var now = new Date();
    var currentTime = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();

    reqObj.mail = $('.mailBox').val();
    reqObj.feedback = $('.commentBox').val();
    reqObj.product_id = "1";    
    reqObj.created_at = currentTime;    

    if (reqObj.mail.length === 0 || reqObj.feedback.length === 0) {
      setResponseMsg(chrome.i18n.getMessage("feedbackFeildsEmptyMsg"), false);
    } else {
      $.ajax({
          url: "http://www.staydan.com/tinning/api/index.php/addFeedback",
          type:'Post',
          data:reqObj,
          cache:false,
        success : function(obj) {
          var state = JSON.parse(obj).result;
          if(state === "Success"){
            setResponseMsg(chrome.i18n.getMessage("feedbackSuccessMsg"), true);
          } else {
            var errorMsg = obj.errorMsg;
            setResponseMsg("Sorry! " + errorMsg, false);
          }
        },
        error: function(){
          setResponseMsg(chrome.i18n.getMessage("feedbackFailureMsg"), false);
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

    $("#open-tabs-in-new-window").toggleClass("on", configs["open-tabs-in-new-window"]);
    $("#close-tab-after-tin").toggleClass("on", configs["close-tab-after-tin"]);
    $("#send-usage-statistics").toggleClass("on", configs["send-usage-statistics"]);
    $("#scroll-to-the-last-position").toggleClass("on", configs["scroll-to-the-last-position"]);
  };

  var registerEvents = function () {
    $("#display-mode .radio-item").click(function () {
      var displayMode = $("#display-mode .radio-slider").hasClass("radio-slider-move");
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", !displayMode);
      storage.setConfigValueByKey("display_mode", (!displayMode ? "grid" : "list"));
    });

    $("#open-tabs-in-new-window").click(function () {
      var openTabsInNewWindow = $("#open-tabs-in-new-window").hasClass("on");
      $("#open-tabs-in-new-window").toggleClass("on", !openTabsInNewWindow);
      storage.setConfigValueByKey("open-tabs-in-new-window", !openTabsInNewWindow);
    });

    $("#close-tab-after-tin").click(function () {
      var closeTabAfterTin = $("#close-tab-after-tin").hasClass("on");
      $("#close-tab-after-tin").toggleClass("on", !closeTabAfterTin);
      storage.setConfigValueByKey("close-tab-after-tin", !closeTabAfterTin);
    });

    $("#send-usage-statistics").click(function () {
      var closeTabAfterTin = $("#send-usage-statistics").hasClass("on");
      $("#send-usage-statistics").toggleClass("on", !closeTabAfterTin);
      storage.setConfigValueByKey("send-usage-statistics", !closeTabAfterTin);
    });

    $("#scroll-to-the-last-position").click(function () {
      var scrollToLastPosition = $("#scroll-to-the-last-position").hasClass("on");
      $("#scroll-to-the-last-position").toggleClass("on", !scrollToLastPosition);
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
                var tpl = $("#donate-" + $(this).attr("id").split("-")[1] + "-tpl").html();

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

    $(".radio-button, .toggle-button").hover(
      function (element) {
        var leftDis = $("body").offset().left + element.currentTarget.offsetLeft + element.currentTarget.offsetWidth + 5;
        $("#option-tooltips-popover").css("left", leftDis > 0 ? leftDis : 0);
        $("#option-tooltips-popover").css("top", element.currentTarget.offsetTop + $("#alternative-panel").offset().top);

        var iconTooltipsSource = "<div class='popover-detail'>{{title}}</div>";
        var iconTooltipsTemplate = Handlebars.compile(iconTooltipsSource);
        var appearAt = -1, configArray = null;
        if (element.currentTarget.className.indexOf("toggle-button") >= 0) {
          appearAt = toggleButtonArray.contains({toggle_id:  $(this).attr("id")}, ["toggle_id"]);
          configArray = toggleButtonArray;
        } else if (element.currentTarget.className.indexOf("radio-button") >= 0){
          appearAt = optionsRadioButtonArray.contains({radio_id:  $(this).attr("id")}, ["radio_id"]);
          configArray = optionsRadioButtonArray;
        }
        if (appearAt !== -1) {
          var context = {title: configArray[appearAt].tooltips};
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