document.addEventListener('DOMContentLoaded', function () {
    const chatStatusText = document.getElementById('chat_status');
    const chatMessageText = document.getElementById('chat_message');
    const obsStatusText = document.getElementById('obs_status');
    const backgroundServiceStatusText = document.getElementById('background_status');

    // Connect to OBS button
    document.getElementById('connectOBS').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'connectOBS' });
    });

    document.getElementById('connectToChat').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'connectToChat' });
    });

    // Start Timer button
    document.getElementById('checkBackgroundService').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'checkBackgroundService' });
    });

    // Stop Timer button
    document.getElementById('stopTimer').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'stopTimer' });
    });

    // Check Chat Status button
    document.getElementById('checkStatus').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'checkChatStatus' });
    });

    // Setup Observer button
    document.getElementById('setupObserver').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'setupObserver' });
    });

    document.getElementById('setupIframe').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'setupChatIframe' });
    });

    document.getElementById('removeObserver').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'removeObserver' });
    });

    // Listen for status updates from background.js
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'updateChatStatus') {
            chatStatusText.textContent = `Status: ${request.status}`;
        }
        if (request.action === 'updateChatMessage') {
            chatMessageText.textContent = `: ${request.message}`;
        }
        if (request.action === 'updateOBSStatus') {
            obsStatusText.textContent = `: ${request.status}`;
        }
        if (request.action === 'updateBackgroundServiceStatus') {
            backgroundServiceStatusText.textContent = `Srv: ${request.status}`;
        }
    });
});
