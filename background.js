var B_CODE = '00000000-0000-4000-y000-000000000000';
var B_LABEL = 'Summarize';
var B_PROMPT = 'Please summarize: $0';
var B_SYSTEM = 'Your primary objective is to provide very concise summaries, eliminating any superfluous details. The user will give you a text; condense its core meaning into as few words as possible';


// Function for reseting context menu (empty and refill)
function resetContext() {
  chrome.contextMenus.removeAll();
  chrome.storage.sync.get("context_options", (data) => {
    for (const [id, value] of Object.entries(data.context_options)) {
      if (value.label == ''){
        continue;
      }
      chrome.contextMenus.create({
        id,
        title: value.label,
        contexts:[ "selection" ]
      });
    }
  });
}


// Run on install
chrome.runtime.onInstalled.addListener( () => {
  chrome.storage.sync.set({'tts':false});
  // $0 is converted into the highlighted text
  let dat = "Please summarize: $0";
  chrome.storage.sync.set({"context_options":
    { [B_CODE]: { "label":B_LABEL, "data":B_PROMPT, "system":B_SYSTEM} }});
  chrome.storage.sync.set({"popup_options":
    { "height":250, "width":300}});
  chrome.storage.sync.set({"API_KEY":''});

  chrome.tabs.create({ url: chrome.runtime.getURL("options/options.html") });
  resetContext();
  });

// Run on startup
chrome.runtime.onStartup.addListener( () => {
  let syncProm = chrome.storage.sync.get();
  syncProm.then((syncDat) => {
    if (!('tts'  in syncDat)) {
      console.log("TTS not found, setting to false");
      chrome.storage.sync.set({'tts':false});
    }
    if (!('context_options' in syncDat)) {
      chrome.storage.sync.set({"context_options":
        { [B_CODE]: { "label":B_LABEL, "data":B_PROMPT, "system":B_SYSTEM } }});
    }
    if (!('popup_options' in syncDat)) {
      chrome.storage.sync.set({"popup_options":
        { "height":250, "width":300}});
    }
    if (!('API_KEY' in syncDat)) {
      console.log("API_KEY not found, creating empty and will prompt user on next popup");
      chrome.storage.sync.set({"API_KEY":'SetAPIKey'});
    }


  });
  resetContext();
});
  

// Create popup window, save selected text in storage
chrome.contextMenus.onClicked.addListener( ( info, tab ) => {
    console.log(info.menuItemId);
    // 'context_options', 'popup_options'
    let options_prm = chrome.storage.sync.get(); 
    options_prm.then(options=>{
      if (info.menuItemId in options.context_options) {
        chrome.storage.session.set(
          {"contextRequest":
            {"selectedText": info.selectionText,"id":info.menuItemId}}
        );
        let popupURL = chrome.runtime.getURL("popup/popup.html");
        let creating = chrome.windows.create({
          url: popupURL,
          type: "popup",
          height: options.popup_options.height, 
          width: options.popup_options.width,
        });
      }
    });
});
