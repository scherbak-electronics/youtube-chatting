let obsSocket = null;
let monitoringInterval = null;
let chatReady = false;

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

let monitoringHandler = () => {
    sendToTab({ action: 'checkStatus' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        updateBackgroundServiceStatus('Error:' + chrome.runtime.lastError);
      }
      if (response) {
        updatePopupChatStatus(`Iframe: ${response.iframeStatus}, Observer: ${response.observerStatus}`);
        if (!chatReady) {
          if (response.iframeStatus !== 'ok') {
            setupChatIframe();
          } else {
            if (response.observerStatus !== 'ok') {
              setupObserver();
            } else {
              chatReady = true;
            }
          }
        }
      } else {
        console.log('check status error');
        updateBackgroundServiceStatus('check status error');
      }
    });
}

function startMonitoring() {
  monitoringInterval = setInterval(monitoringHandler, 2000);  // Check every 2 seconds
}

// Stop iframe checking timer
function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

// Update popup status
function updatePopupChatStatus(status) {
  chrome.runtime.sendMessage({ action: 'updateChatStatus', status });
}
function updatePopupChatMessage(message) {
  chrome.runtime.sendMessage({ action: 'updateChatMessage', message });
}

function updatePopupOBSStatus(status) {
  chrome.runtime.sendMessage({ action: 'updateOBSStatus', status });
}

function updateBackgroundServiceStatus(status) {
  chrome.runtime.sendMessage({ action: 'updateBackgroundServiceStatus', status });
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

// Initiate OBS connection and iframe checking on startup
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Chat Observer Extension installed');
});



// Background listener to handle messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === 'newChatMessage') {
    updatePopupChatMessage(request.message);
  }

  if (request.action === 'connectOBS') {
    //connectToOBS();
  }
  if (request.action === 'connectToChat') {
    startMonitoring();
    updatePopupChatStatus('chat starting...');
  }

  if (request.action === 'checkChatStatus') {
      sendToTab({ action: 'checkStatus' }, (response) => {
        const iframeStatus = response ? response.iframeStatus : 'unknown';
        const observerStatus = response ? response.observerStatus : 'unknown';
        updatePopupChatStatus(`Iframe: ${iframeStatus}, Observer: ${observerStatus}`);
      });
  }
  if (request.action === 'setupChatIframe') {
    sendToTab({ action: 'setupChatIframe' }, (response) => {
      const iframeStatus = response ? response.iframeStatus : 'unknown';
      const observerStatus = response ? response.observerStatus : 'unknown';
      updatePopupChatStatus(`Iframe: ${iframeStatus}, Observer: ${observerStatus}`);
    });
  }
  if (request.action === 'setupObserver') {
    sendToTab({ action: 'setupObserver' }, (response) => {
      if (response) {
        const observerStatus = response ? response.observerStatus : 'unknown';
        updatePopupChatStatus(`Observer: ${observerStatus}`);
      }
    });
  }
  if (request.action === 'checkBackgroundService') {
    updateBackgroundServiceStatus('Service still alive');
  }
  sendResponse({resp: 'ok'});
  return true; // Indicate async response if needed
});

function setupChatIframe() {
  sendToTab({ action: 'setupChatIframe' }, (response) => {
    const iframeStatus = response ? response.iframeStatus : 'unknown';
    updatePopupChatStatus(`Iframe: ${iframeStatus}`);
  });
}

function setupObserver() {
  sendToTab({ action: 'setupObserver' }, (response) => {
    if (response) {
      const observerStatus = response ? response.observerStatus : 'unknown';
      updatePopupChatStatus(`Observer: ${observerStatus}`);
    }
  });
}

function sendToTab(request, response) {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found.");
        updateBackgroundServiceStatus('Error: No active tab found.');
        return;
      }

      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, request, response);
      } else {
        console.error("Active tab does not have a valid ID.");
        updateBackgroundServiceStatus('Error: Active tab does not have a valid ID.');
      }
    });
  } catch (error) {
    console.error('Extension context invalidated or communication error:', error);
    updateBackgroundServiceStatus('Ex: ' + error);
  }
}