$(document).ready(function(){
  console.log("ready ");
  // Sync the configs
  tinning.syncConfig();
  
  // Init the tinning important configurations in this method.
  tinning.syncTinningFolder(true);

  // Register all the event first.
  tinning.registerEvent();

});