/*global storage:false */
"use strict";

var storage = {
  // Key for config
  configKey: "tinning_config",

  // Key for offsets config
  autoScrollConfigKey: "tinning_offsets",

  // Default configurations.
  configsArray: [
    {key: "display_mode", value: "grid"}, 
    {key: "close-tab-after-tin", value: true},
    {key: "open-tabs-in-new-window", value: true},
    {key: "send-usage-statistics", value: true},
    {key: "scroll-to-the-last-position", value: true}
  ],

  /*********************************************/
  /*               Tinnig Configs              */
  /*********************************************/
  // Init all the configurations
  iniConfigs: function () {

    // Initialize the configurations for Tinning
    var configs = JSON.parse(storage.retrieveStorageByKey(storage.configKey));
    if (configs === null || configs === "") {
      configs = {};
    }

    for (var i = 0; i < storage.configsArray.length; i++) {
      if (configs === null || configs[storage.configsArray[i].key] === undefined) {
        configs[storage.configsArray[i].key] = storage.configsArray[i].value;
      }
    }

    storage.saveStorageValue(storage.configKey, JSON.stringify(configs));
    
    // Initialize the offsets storage.
    var offsetsList = JSON.parse(storage.retrieveStorageByKey(storage.autoScrollConfigKey));
    
    if (offsetsList === null || offsetsList === "") {
      offsetsList = [];
      storage.saveStorageValue(storage.autoScrollConfigKey, JSON.stringify(offsetsList));
    }

    return configs;
  },

  // Retrieve all key-value configurations.
  retrieveConfigByKey: function (key) {
    var configs = JSON.parse(storage.retrieveStorageByKey(storage.configKey));
    return configs[key];
  },

  // Update config value by key.
  setConfigValueByKey: function (key, value) {
    var configs = JSON.parse(storage.retrieveStorageByKey(storage.configKey));
    configs[key] = value;
    storage.saveStorageValue(storage.configKey, JSON.stringify(configs));
  },

  /*********************************************/
  /*           Tinnig Offset Configs           */
  /*********************************************/

  // Retrieve all key-value offsets.
  fetchOffsetsByUrlAndTitle: function (url, title) {
    var savedOffset = [];
    var offsetsList = JSON.parse(storage.retrieveStorageByKey(storage.autoScrollConfigKey));

    for (var i = 0; i < offsetsList.length; i++) {
      if (title === offsetsList[i].title && url === offsetsList[i].url) {
        savedOffset = offsetsList[i];
        break;
      }
    }
    return savedOffset;
  },

  // Update config value by key. example: {"top": 120,"title": "","url": ""}
  addOffsetsItems: function (items) {
    var offsetsList = JSON.parse(storage.retrieveStorageByKey(storage.autoScrollConfigKey));
    var addUniqueOffsetItem = function (item) {
      var appearAt = offsetsList.contains(item, ["url", "title"]);
      if (appearAt !== -1) {
        offsetsList.removeAt(appearAt);
      }
      offsetsList.push(item);
    };

    if (Object.prototype.toString.call(items) === "[object Array]") {
      items.forEach(addUniqueOffsetItem);
    } else {
      addUniqueOffsetItem(items);
    }
    storage.saveStorageValue(storage.autoScrollConfigKey, JSON.stringify(offsetsList));
  },

  removeOffsetsByUrls: function (urls) {
    var offsetsList = JSON.parse(storage.retrieveStorageByKey(storage.autoScrollConfigKey));
    for (var i = 0; i < offsetsList.length; i++) {
      if (urls.indexOf(offsetsList[i].url) !== -1) {
        offsetsList.splice(i , 1);
      }
    }
    
    storage.saveStorageValue(storage.autoScrollConfigKey, JSON.stringify(offsetsList));
  },

  /*********************************************/
  /*              Common functions             */
  /*********************************************/

  // Retrieve storage value by key.
  retrieveStorageByKey: function (key){
    return window.localStorage.getItem(key);
  },

  // Update storage value by key.
  saveStorageValue: function (key, value){
    window.localStorage.setItem(key, value);
  }
};