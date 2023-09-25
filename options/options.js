var keyInput_txt = document.getElementById('apiKeyInput');
var keySave_btn = document.getElementById('saveApiKey');

chrome.storage.sync.get('API_KEY',(data) => {
  if (data.API_KEY) {
    keyInput_txt.value = data.API_KEY;
  }
})

keySave_btn.addEventListener('click',() => {
  chrome.storage.sync.set({"API_KEY":keyInput_txt.value});
})

/// Text to speech options
var tts_checkbox = document.getElementById('tts_checkbox');

// Fill html
chrome.storage.sync.get("tts",(data) => {
  if (data.tts) {
    tts_checkbox.checked = true
  }
});

// Save user changes
tts_checkbox.addEventListener("change", (event)=> {
    if (event.target.checked) {
        chrome.storage.sync.set({"tts":true});
        console.log("TTS turned on")
    } else {
        chrome.storage.sync.set({"tts":false});
        console.log("TTS turned off")
    }
})

/// Popup Options:
var width_textbox = document.getElementById('width');
var height_textbox = document.getElementById('height');

// fill html
chrome.storage.sync.get('popup_options', (dat)=>{
  width_textbox.value = dat.popup_options.width;
  height_textbox.value = dat.popup_options.height;
});

// create listeners for change in value, save to sync
// width
width_textbox.addEventListener("input", (e)=>{
  console.log(e.target.value);
  chrome.storage.sync.get('popup_options', (dat)=>{
    var newPopupOption = dat.popup_options;
    newPopupOption.width = Number(e.target.value);
    chrome.storage.sync.set({'popup_options':newPopupOption});
  });
});
// height
height_textbox.addEventListener("input", (e)=>{
  console.log(e.target.value);
  chrome.storage.sync.get('popup_options', (dat)=>{
    var newPopupOption = dat.popup_options;
    newPopupOption.height = Number(e.target.value);
    chrome.storage.sync.set({'popup_options':newPopupOption});
  });
});

/// Context Menu Options:
const addOptionButton = document.getElementById("add-option");
const optionList = document.getElementById("option-list");

// Fill html
chrome.storage.sync.get("context_options", (data) => {
  console.log(data);
  for (const [id, value] of Object.entries(data.context_options)) {
    console.log("Loaded: " + id);
    console.log(value);
    const newOption = createOption(id, value.label, value.data, value.system);
    optionList.appendChild(newOption);
  }
});

// Add event listener to the add button to add a new option to the list
addOptionButton.addEventListener("click", () => {
  const newID = uuidv4();
  const newOption = createOption(id=newID);
  optionList.appendChild(newOption);
  saveOption(newID,newOption);
});

// Function for creating the html options elements along with saving listeners
function createOption(id,label = "", data = "$0", system = "") {
  const newOption = document.createElement("li");
  newOption.classList.add("option_item");

  // label
  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.classList.add("option_label");
  labelInput.value = label;
  // labelInput.addEventListener("input", () => {
  //   saveOption(id,newOption);
  // });

  // data
  const dataTextarea = document.createElement("textarea");
  dataTextarea.classList.add("option_data");
  dataTextarea.value = data;
  // dataTextarea.addEventListener("input", () => {
  //   saveOption(id,newOption);
  // });

  // system
  const systemTextarea = document.createElement("textarea");
  systemTextarea.classList.add("option_system");
  systemTextarea.value = system;
  // systemTextarea.addEventListener("input", () => {
  //   saveOption(id,newOption);
  // });

  // save button
  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.classList.add("save_button");
  saveButton.addEventListener("click", () => {
    saveOption(id,newOption);
  });

  // delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.classList.add("delete_button");
  deleteButton.addEventListener("click", () => {
    optionList.removeChild(newOption);
    removeOption(id);
  });
  
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("button_container");
  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(deleteButton);

  newOption.appendChild(labelInput);
  newOption.appendChild(dataTextarea);
  newOption.appendChild(systemTextarea);
  newOption.appendChild(buttonContainer);
  // newOption.appendChild(saveButton);
  // newOption.appendChild(deleteButton);

  return newOption;
}

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

// Function for saving a context option to sync storage
function saveOption(id,option) {
  // Retrieve option ID and label and data from the option element
  const labelElement = option.querySelector(".option_label");
  const dataElement = option.querySelector(".option_data");
  const systemElement = option.querySelector(".option_system");
  const label = labelElement.value;
  const data = dataElement.value;
  const system = systemElement.value;

  // Save label and data to Chrome sync storage using the option ID as the key
  chrome.storage.sync.get("context_options").then(options_old=>{
    var options = options_old.context_options;
    options[id] = {label, data, system};
    chrome.storage.sync.set({"context_options":options});

    resetContext();
  });
  console.log("Saving: ", id);
}

// Function for removing a context option from sync storage
function removeOption(id) {
  // Remove option and its corresponding data from Chrome sync storage using the option ID as the key
  // chrome.storage.sync.remove(id);
  chrome.storage.sync.get("context_options").then(data=>{
    var options = data.context_options;
    delete options[id];
    chrome.storage.sync.set({"context_options":options});
  });
  console.log("Deleting: ", id);
  resetContext();
}

// Generate a random UUID (version 4)
// Not guaranteed unique but... chances of duplicate are negligible
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
  const r = (Math.random() * 16) | 0,
  v = c == "x" ? r : (r & 0x3) | 0x8;
  return v.toString(16);
  });
  }
