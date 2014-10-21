/*global $:false */
/*global storage:false */
"use strict";

$(document).ready(function(){

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
  };

  registerEvents();
  syncConfig();
});