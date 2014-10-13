// tinning
// {
//    config : [
//    
//    ],
//    bookmarks: [
//    
//    ]
// }
var storage = {
  configKey: "tinning_config",
  configsArray: [{key: "display_mode", value: "grid"}, {key: "open_new_window", value: "true"}],

  iniConfigs: function () {
    var configs = JSON.parse(this.retrieveValueByKey(this.configKey));
    if (configs === null || configs === "") {
      configs = {};
    }
    for (var i = 0; i < this.configsArray.length; i++) {
      if (configs === null || configs[this.configsArray[i].key] === undefined) {
        configs[this.configsArray[i].key] = this.configsArray[i].value;
      }
    };

    this.saveValue(this.configKey, JSON.stringify(configs));

    return configs;
  },

  retrieveConfigByKey: function (key) {
    var configs = JSON.parse(this.retrieveValueByKey(this.configKey));
    return configs[key];
  },

  setConfigValueByKey: function (key, value) {
    var configs = JSON.parse(this.retrieveValueByKey(this.configKey));
    configs[key] = value;
    this.saveValue(this.configKey, JSON.stringify(configs));
  },

  retrieveValueByKey: function (key){
    return window.localStorage.getItem(key);
  },

  saveValue: function (key, value){
    window.localStorage.setItem(key, value);
  }
}