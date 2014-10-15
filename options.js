$(document).ready(function(){
  
  syncConfig = function () {
    this.configs = storage.iniConfigs();
    
    if (this.configs.display_mode === "grid") {
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", true);
    } else if (this.configs.display_mode === "list") {
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", false);
    }
    
    $("#open-tabs-in-new-window .radio-slider").toggleClass("radio-slider-move", this.configs["open-tabs-in-new-window"]);
    $("#close-tab-after-tin .radio-slider").toggleClass("radio-slider-move", this.configs["close-tab-after-tin"]);
    $("#send-usage-statistics .radio-slider").toggleClass("radio-slider-move", this.configs["send-usage-statistics"]);
  }

  registerEvents = function () {
    $("#display-mode .radio-item").click(function (element) {
      var displayMode = $("#display-mode .radio-slider").hasClass("radio-slider-move");
      $("#display-mode .radio-slider").toggleClass("radio-slider-move", !displayMode);
      storage.setConfigValueByKey("display_mode", (!displayMode ? "Grid" : "List"));
    });    

    $("#open-tabs-in-new-window .radio-item").click(function (element) {
      var openTabsInNewWindow = $("#open-tabs-in-new-window .radio-slider").hasClass("radio-slider-move");
      $("#open-tabs-in-new-window .radio-slider").toggleClass("radio-slider-move", !openTabsInNewWindow);
      storage.setConfigValueByKey("open-tabs-in-new-window", !openTabsInNewWindow);
    });    

    $("#close-tab-after-tin .radio-item").click(function (element) {
      var closeTabAfterTin = $("#close-tab-after-tin .radio-slider").hasClass("radio-slider-move");
      $("#close-tab-after-tin .radio-slider").toggleClass("radio-slider-move", !closeTabAfterTin);
      storage.setConfigValueByKey("close-tab-after-tin", !closeTabAfterTin);
    });
    
    $("#send-usage-statistics .radio-item").click(function (element) {
      var closeTabAfterTin = $("#send-usage-statistics .radio-slider").hasClass("radio-slider-move");
      $("#send-usage-statistics .radio-slider").toggleClass("radio-slider-move", !closeTabAfterTin);
      storage.setConfigValueByKey("send-usage-statistics", !closeTabAfterTin);
    });
  }

  registerEvents();
  syncConfig();
});