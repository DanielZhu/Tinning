$(document).ready(function(){
  console.log("ready ");

  // Register all the event first.
  tinning.registerEvent();

  // Sync the configs
  tinning.syncConfig();
  
  // Init the tinning important configurations in this method.
  tinning.syncTinningFolder(true);
});