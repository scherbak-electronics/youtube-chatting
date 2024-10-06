let obsSocket = null;
let obsUrl = null;
let obsCommands = null;
let popupPort = null;

chrome.storage.sync.get(['obsUrl'], (items) => {
    if (items.obsUrl) {
        obsUrl = items.obsUrl;
    }
});

chrome.storage.sync.get(['commandMappings'], (items) => {
    obsCommands = items.commandMappings || null;
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup") {
        popupPort = port;
        console.log("Popup opened in obs.js");

        // Detect when the popup closes
        popupPort.onDisconnect.addListener(() => {
            popupPort = null;
            console.log("Popup was closed (detected in background script)");
        });
    }
});

console.log("OBS config: ", {obsUrl: obsUrl, commands: obsCommands});
function sendToPopup(request) {
    if (popupPort) {
        popupPort.postMessage(request);
    }
}

function getOBSCommand(chatMsg) {
         console.log('obsCommands:', obsCommands);
    if (obsCommands) {
        let command = parseCommandParam(chatMsg);
        let cmdKey = chatMsg;
        let param = null;
        if (command) {
            cmdKey = command.cmd;
            param = command.param;
        }
        let cmdMapping = obsCommands.find((mapping) => {
            return mapping.chatCommand === cmdKey;
        });
        if (cmdMapping) {
           return {
               action: cmdMapping.action,
               scene: cmdMapping.sceneName,
               media: cmdMapping.mediaName,
               param: param
           };
        }
    }
    return null;
}
function connectToOBS() {
    if (obsUrl) {
        sendToPopup({action: 'updateOBSStatus', status: `Trying to connect ${obsUrl}`});
        try {
            obsSocket = new WebSocket(obsUrl);  // Replace with your OBS WebSocket URL
        } catch (error) {
            console.log('Ex: ', error);
            sendToPopup({action: 'updateOBSStatus', status: `Error: ${error}`});
            return;
        }

        obsSocket.onopen = function() {
            console.log('WebSocket connection to OBS established.');
            const identifyMessage = {
                "op": 1,
                "d": { "rpcVersion": 1 }
            };
            obsSocket.send(JSON.stringify(identifyMessage));
            sendToPopup({action: 'updateOBSStatus', status: 'connected'});
        };

        obsSocket.onmessage = function(event) {
            const message = JSON.parse(event.data);
            if (message.op === 2) {
                console.log('Authenticated with OBS.');
            }
        };

        obsSocket.onclose = function() {
            console.log('OBS WebSocket connection closed.');
            sendToPopup({action: 'updateOBSStatus', status: 'connection closed'});
        };

        obsSocket.onerror = function(error) {
            console.log('OBS WebSocket Error:', error);
            sendToPopup({action: 'updateOBSStatus', status: 'connection error'});
        };
    }
}

function isOBSConnected() {
    return obsSocket && obsSocket.readyState === 1;
}

function chatCommandHandler(chatCmd) {
    let command = getOBSCommand(chatCmd);
    console.log('command:', command);
    if (command) {
        sendToPopup({action: 'updateOBSCommand', command: command});
        if (command.action === 'switchScene') {
            if (command.scene) {
                switchScene(command.scene);
            }
        }
        if (command.action === 'playMedia') {
            if (command.media) {
                playMedia(command.media);
            }
        }
        if (command.action === 'setText') {
            if (command.media && command.param) {
                setText(command.media, command.param);
            }
        }
    } else {
        sendToPopup({action: 'updateOBSCommand', error: 'Invalid command'});
    }
}
function switchScene(sceneName) {
    if (obsSocket && obsSocket.readyState === 1) {
        obsSocket.send(JSON.stringify({
            "op": 6,
            "d": {
                "requestType": "SetCurrentProgramScene",
                "requestId": generateRequestId(),
                "requestData": { "sceneName": sceneName }
            }
        }));
    } else {
        sendToPopup({action: 'updateOBSStatus', status: 'connection error'});
    }
}

function playMedia(mediaSourceName) {
    if (obsSocket && obsSocket.readyState === 1) {
        obsSocket.send(JSON.stringify({
            "op": 6,  // Request operation code
            "d": {
                "requestType": "SetInputSettings",  // Request type to change input settings
                "requestId": generateRequestId(),  // Generate a unique request ID
                "requestData": {
                    "inputName": mediaSourceName,  // The media source in OBS (e.g., video or audio source)
                    "inputSettings": {
                        "playback": { "state": "playing" }  // Command OBS to start playing the media
                    }
                }
            }
        }));
    } else {
        console.log("OBS WebSocket is not connected or ready.");
        sendToPopup({action: 'updateOBSStatus', status: 'connection error'});
    }
}


function setText(sourceName, text) {
    if (obsSocket && obsSocket.readyState === 1) {
        obsSocket.send(JSON.stringify({
            "op": 6,
            "d": {
                "requestType": "SetInputSettings",
                "requestId": generateRequestId(),
                "requestData": {
                    "inputName": sourceName,
                    "inputSettings": { "text": text }
                }
            }
        }));
    } else {
        sendToPopup({action: 'updateOBSStatus', status: 'connection error'});
    }
}

// Helper function to generate a request ID
function generateRequestId() {
    return `request-${Date.now()}`;
}

function parseCommandParam(command) {
    if (command.startsWith("$st:")) {
        // Extract the message after the "$st:"
        const params = command.split(":");

        // Return the message trimmed of extra spaces
        return {
            cmd: params[0],
            param: params[1] ? params[1].trim() : null
        };
    }
    return null;
}

export { connectToOBS, isOBSConnected, chatCommandHandler };
