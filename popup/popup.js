API_KEY = '';
// MODEL = "text-babbage-001";
// MODEL = "text-ada-001";
MODEL = 'text-davinci-003';
CHAT_MODEL = 'gpt-4';
CHAT_ROLE = "Your primary objective is to provide very concise summaries, eliminating any superfluous details. The user will give you a text; condense its core meaning into as few words as possible. Make it light and fun"

messages = [{"role":"system","content":CHAT_ROLE}];

// get selected text from storage

// text to speech, only say if 'tts' in options is checked
function maybeSay(text) {
    var tts_promise = chrome.storage.sync.get('tts');
    tts_promise.then(stuff=>{
        if (stuff.tts) {
            textToSpeech(text)
    }})
}
function textToSpeech(text) {
    // Create a new SpeechSynthesisUtterance object
    const utterance = new SpeechSynthesisUtterance(text);
  
    // Set the voice to use for speech synthesis
    utterance.voice = speechSynthesis.getVoices()[0];
  
    // Speak the text
    speechSynthesis.speak(utterance);
  }


function count_words(string){
    return string.match(/\w+/g).length;
}

function get_api(prompt) {
    // returns a promise
    return     fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + API_KEY
        },
        // body: '{\n  "model": "text-davinci-003",\n  "prompt": "Say this is a test",\n  "max_tokens": 7,\n  "temperature": 0\n}',
        body: JSON.stringify({
            'model': MODEL,
            'prompt': prompt,
            'max_tokens': 1024,
            'temperature': 0.5
        })
    }).then(response => {
        return response.json();
    })
}

// sends chat to OpenAPI, receives and returns response
function get_api_chat(messages) {
    return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + API_KEY
        },
        body: JSON.stringify({
            'model': CHAT_MODEL,
            'messages': messages,
            'max_tokens': 1024,
            'temperature': 0.5
        })
    }).then(response => {
        return response.json();
    })
}



function make_prompt(text,re_out,re_in=/.*/) {
    const matches = text.match(re_in);
    return re_out.replace(/\$\d/g, match => {
      const index = parseInt(match.substring(1));
      return matches[index] || '';
    });
}

// Get highlighted text, 
chrome.storage.session.get("contextRequest", (sessiondata) =>{
    var selectedText = sessiondata.contextRequest.selectedText;
    var id = sessiondata.contextRequest.id;
    chrome.storage.sync.get(null, (syncdata)=> {
        var reg_out = syncdata.context_options[id].data;
        var prompt = make_prompt(selectedText,reg_out);
        document.getElementById('selected-text').innerText = prompt;
        messages.push({"role":"user","content":prompt});

        get_api_chat(messages).then((stuff)=>{
            messages.push(stuff.choices[0].message)
            var text = stuff.choices[0].message.content;
            appendTextToHistory(text,"initcompletion","--")
            maybeSay(text);
        });
    });
});


function appendTextToHistory(text,tag,prior='\n'){
    var userInput = document.createElement("div");
    
    userInput.className = tag;

    var prior_p = document.createElement("p");
    var prior_text_node = document.createTextNode(prior);
    prior_p.appendChild(prior_text_node);
    userInput.appendChild(prior_p);
    
    var paras = document.createElement("li");
    paras.className = tag + "text" + "list";

    text.trim().split('\n').forEach(element => {
        console.log(element);
        var tag_p = document.createElement("p");
        tag_p.className = tag + "text";
        var text_node = document.createTextNode(element);
    
        tag_p.appendChild(text_node);
        
        userInput.appendChild(tag_p);
        
        document.getElementById("history").appendChild(userInput);
        userInput.scrollIntoView();
    });
}

// Event handler for keydown
document.addEventListener('keydown', (event) =>{
    var code = event.code;
    textarea = document.getElementById("user-textarea");
    
    // enter new communication with api
    if (code === "Enter" && textarea.value.trim().length > 0){
        if (!event.shiftKey){
            var text = textarea.value.trim();
            appendTextToHistory(text,"prompt","----------");
            textarea.value = "";

            // get response from API
            messages.push({"role":"user","content":text})
            get_api_chat(messages).then(stuff=>{
                messages.push(stuff.choices[0].message)
                var responsetext = stuff.choices[0].message.content;
                appendTextToHistory(responsetext,"initcompletion","--")
                maybeSay(responsetext);
            });
        }
    }
    
    // close if esc key pressed
    if (code === "Escape"){
        window.close();
    }

})


const tx = document.getElementsByTagName("textarea");
for (let i = 0; i < tx.length; i++) {
  tx[i].setAttribute("style", "height:" + (tx[i].scrollHeight) + "px;overflow-y:hidden;");
  tx[i].addEventListener("input", OnInput, false);
}

function OnInput() {
  this.style.height = 0;
  this.style.height = (this.scrollHeight) + "px";
}