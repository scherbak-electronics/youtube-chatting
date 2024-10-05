let obsSocket = null;
let tryingInterval = null;
let popupPort = null;
let contentPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    popupPort = port;
    console.log("Popup opened");

    // Detect when the popup closes
    popupPort.onDisconnect.addListener(() => {
      popupPort = null;
      console.log("Popup was closed (detected in background script)");
    });
    popupPort.onMessage.addListener((request) => {
      console.log("Message from popup");
      popupListener(request);
    });
    sendToContent({ action: 'checkStatus' });
  }
  if (port.name === "content") {
    contentPort = port;
    console.log("Content opened");
    port.onDisconnect.addListener(() => {
      contentPort = null;
      console.log("Content was closed (detected in background script)");
    });
    contentPort.onMessage.addListener((request) => {
      console.log("Message from content");
      contentListener(request);
    });
    sendToContent({ action: 'checkStatus' });
  }
});

function sendToContent(request) {
  if (contentPort) {
    contentPort.postMessage(request);
  } else {
    sendToPopup({action: 'updateStatus', status: {background: 'Please reload youtube page CMD+R'}});
  }
}
function sendToPopup(request) {
  if (popupPort) {
    popupPort.postMessage(request);
  }
}
function popupListener(request) {
  if (request.action === 'popupOpened') {
    //connectToOBS();
  }
  if (request.action === 'connectOBS') {
    //connectToOBS();
  }
  if (request.action === 'connectToChat') {
    startTryingToConnectToContent();
  }
  if (request.action === 'checkContentStatus') {
    sendToContent({ action: 'checkStatus' });
  }
}
function contentListener(request) {
  if (request.action === 'updateStatus') {
    sendToPopup({action: 'updateStatus', status: request.status});
  }
  if (request.action === 'tryToConnectResponse') {
    sendToPopup({action: 'updateStatus', status: request.status});
    if (request.status.iframe !== 'ok') {
      if (request.status.observer !== 'ok') {
        sendToContent({ action: 'setupChatIframe' });
      }
    } else {
      if (request.status.observer !== 'ok') {
        sendToContent({ action: 'setupObserver' });
      } else {
        if (request.status.container !== 'ok') {
          console.log('container missing!');
          sendToPopup({action: 'updateStatus', status: {background: 'Please reload youtube page CMD+R'}});
        } else {
          stopTryingToConnectToContent();
        }
      }
    }
  }
  if (request.action === 'newChatMessage') {
    updatePopupChatMessage(request.message);
  }
}

function connectToOBS() {
  obsSocket = new WebSocket('wss://192.168.1.14');  // Replace with your OBS WebSocket URL

  obsSocket.onopen = function() {
    console.log('WebSocket connection to OBS established.');
    const identifyMessage = {
      "op": 1,
      "d": { "rpcVersion": 1 }
    };
    obsSocket.send(JSON.stringify(identifyMessage));
  };

  obsSocket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    if (message.op === 2) {
      console.log('Authenticated with OBS.');
    }
  };

  obsSocket.onclose = function() {
    console.log('OBS WebSocket connection closed.');
  };

  obsSocket.onerror = function(error) {
    console.error('OBS WebSocket Error:', error);
  };
}



function startTryingToConnectToContent() {
  tryingInterval = setInterval(tryToConnectToContent, 2000)
}

function stopTryingToConnectToContent() {
  clearInterval(tryingInterval);
  tryingInterval = null;
}

function tryToConnectToContent() {
  sendToContent({ action: 'tryToConnect' });
}

function updatePopupChatMessage(message) {
  if (popupPort) {
    popupPort.postMessage({action: 'updateChatMessage', message});
  }
}


// Initiate OBS connection and iframe checking on startup
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Chat Observer Extension installed');
});








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
  }
}

// Helper function to generate a request ID
function generateRequestId() {
  return `request-${Date.now()}`;
}

console.log("background ready");