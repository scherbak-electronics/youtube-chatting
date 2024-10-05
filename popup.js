let chatStatusText = null;
let backgroundServiceStatusText = null;
let chatMessageText = null;
const port = chrome.runtime.connect({ name: "popup" });

// Send messages to the background script while the popup is open
port.postMessage({ action: "popupOpened" });

// You can still listen for messages from the background script
port.onMessage.addListener((request) => {
    console.log("Message from background script:");
    if (request.action === 'updateStatus') {
        if (chatStatusText) {
            chatStatusText.textContent = `iframe: ${request.status.iframe}, observer: ${request.status.observer}, container: ${request.status.container}`;
        }
        if (backgroundServiceStatusText) {
            if (request.status.background) {
                backgroundServiceStatusText.textContent = `Bg: ${request.status.background}`;
            }
        }
    }
    if (request.action === 'updateChatMessage') {
        if (chatMessageText) {
            chatMessageText.textContent = `: ${request.message}`;
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    chatStatusText = document.getElementById('chat_status');
    chatMessageText = document.getElementById('chat_message');
    const obsStatusText = document.getElementById('obs_status');
    backgroundServiceStatusText = document.getElementById('background_status');

    // Connect to OBS button
    document.getElementById('connectOBS').addEventListener('click', function () {
        //chrome.runtime.sendMessage({ action: 'connectOBS' });
    });

    document.getElementById('connectToChat').addEventListener('click', function () {
        //chrome.runtime.sendMessage({ action: 'connectToChat' });
        port.postMessage({ action: "connectToChat" });
    });

    // Start Timer button
    document.getElementById('checkBackgroundService').addEventListener('click', function () {
        //chrome.runtime.sendMessage({ action: 'checkBackgroundService' });
    });

    // Stop Timer button
    document.getElementById('stopTimer').addEventListener('click', function () {
        //chrome.runtime.sendMessage({ action: 'stopTimer' });
    });

    // Check Chat Status button
    document.getElementById('checkStatus').addEventListener('click', function () {
        //chrome.runtime.sendMessage({ action: 'checkContentStatus' });
        port.postMessage({ action: "checkContentStatus" });
    });

    // Setup Observer button
    document.getElementById('setupObserver').addEventListener('click', function () {
        //chrome.runtime.sendMessage({ action: 'setupObserver' });
    });

    document.getElementById('setupIframe').addEventListener('click', function () {
        //chrome.runtime.sendMessage({ action: 'setupChatIframe' });
    });

    document.getElementById('removeObserver').addEventListener('click', function () {
        //chrome.runtime.sendMessage({ action: 'removeObserver' });
    });

    // Listen for status updates from background.js
    // chrome.runtime.onMessage.addListener((request) => {
    //     if (request.action === 'updateChatStatus') {
    //         chatStatusText.textContent = `Status: ${request.status}`;
    //     }
    //     if (request.action === 'updateChatMessage') {
    //         chatMessageText.textContent = `: ${request.message}`;
    //     }
    //     if (request.action === 'updateOBSStatus') {
    //         obsStatusText.textContent = `: ${request.status}`;
    //     }
    //     if (request.action === 'updateBackgroundServiceStatus') {
    //         backgroundServiceStatusText.textContent = `Srv: ${request.status}`;
    //     }
    // });
});
console.log("Popup ready");