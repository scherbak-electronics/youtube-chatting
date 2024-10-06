/*
 * popup.js
 * */
let chatStatusText = null;
let backgroundServiceStatusText = null;
let chatMessageText = null;
let obsStatusText = null;
let obsCommandText = null;
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
    if (request.action === 'updateOBSStatus') {
        if (obsStatusText) {
            obsStatusText.textContent = `OBS: ${request.status}`;
        }
    }
    if (request.action === 'updateOBSCommand') {
        if (obsCommandText) {
            obsCommandText.textContent = `a:${request.command.action} s:${request.command.scene} m:${request.command.media} p:${request.command.param}`;
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    chatStatusText = document.getElementById('chat_status');
    chatMessageText = document.getElementById('chat_message');
    obsStatusText = document.getElementById('obs_status');
    obsCommandText = document.getElementById('obs_command');
    backgroundServiceStatusText = document.getElementById('background_status');

    // Connect to OBS button
    document.getElementById('connectOBS').addEventListener('click', function () {
        port.postMessage({ action: 'connectOBS' });
    });

    document.getElementById('connectToChat').addEventListener('click', function () {
        port.postMessage({ action: "connectToChat" });
    });

    // Check Chat Status button
    document.getElementById('checkStatus').addEventListener('click', function () {
        //chrome.runtime.sendMessage({ action: 'checkContentStatus' });
        port.postMessage({ action: "checkContentStatus" });
    });
});
console.log("Popup ready");