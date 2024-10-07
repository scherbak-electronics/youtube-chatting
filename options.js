document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    loadSettings();
    loadMappings();

    // Event listener for saving connection settings
    document.getElementById('saveSettings').addEventListener('click', function() {
        saveSettings();
    });

    // Event listener for adding a new mapping row
    document.getElementById('addMapping').addEventListener('click', function() {
        addMappingRow();
    });

    // Event listener for saving mappings
    document.getElementById('saveMappings').addEventListener('click', function() {
        saveMappings();
    });
});

// Load connection settings from chrome.storage
function loadSettings() {
    chrome.storage.sync.get(['obsUrl', 'obsPassword'], function(items) {
        if (items.obsUrl) {
            document.getElementById('obsUrl').value = items.obsUrl;
        }
        if (items.obsPassword) {
            document.getElementById('obsPassword').value = items.obsPassword;
        }
    });
}

// Save connection settings to chrome.storage
function saveSettings() {
    const obsUrl = document.getElementById('obsUrl').value;
    const obsPassword = document.getElementById('obsPassword').value;

    chrome.storage.sync.set({ obsUrl, obsPassword }, function() {
        const status = document.getElementById('statusMessage');
        status.textContent = 'Settings saved!';
        setTimeout(() => {
            status.textContent = '';
        }, 2000);
    });
}

// Load mappings from chrome.storage
function loadMappings() {
    chrome.storage.sync.get(['commandMappings'], function(items) {
        const mappings = items.commandMappings || [];
        mappings.forEach((mapping) => {
            addMappingRow(mapping.cmdKey, mapping.action, mapping.scene, mapping.media);
        });
    });
}

// Save mappings to chrome.storage
function saveMappings() {
    const mappings = [];
    const rows = document.querySelectorAll('#mappingTableBody tr');

    rows.forEach((row) => {
        const cmdKey = row.querySelector('.chatCommand').value;
        const action = row.querySelector('.action').value;
        const scene = row.querySelector('.sceneName').value;
        const media = row.querySelector('.mediaName').value;

        mappings.push({ cmdKey, action, scene, media });
    });

    chrome.storage.sync.set({ commandMappings: mappings }, function() {
        alert('Mappings saved!');
    });
}

// Add a new row to the mapping table
function addMappingRow(cmdKey = '', action = '', scene = '', media = '') {
    const tableBody = document.getElementById('mappingTableBody');

    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td><input type="text" class="chatCommand" value="${cmdKey}"></td>
        <td>
            <select class="action">
                <option value="switchScene" ${action === 'switchScene' ? 'selected' : ''}>Switch Scene</option>
                <option value="playMedia" ${action === 'playMedia' ? 'selected' : ''}>Play Media</option>
                <option value="pauseMedia" ${action === 'pauseMedia' ? 'selected' : ''}>Pause Media</option>
                <option value="stopMedia" ${action === 'stopMedia' ? 'selected' : ''}>Stop Media</option>
            </select>
        </td>
        <td><input type="text" class="sceneName" value="${scene}"></td>
        <td><input type="text" class="mediaName" value="${media}"></td>
        <td><button class="removeRow">Remove</button></td>
    `;

    // Append the new row to the table
    tableBody.appendChild(newRow);

    // Add event listener to the remove button
    newRow.querySelector('.removeRow').addEventListener('click', function() {
        newRow.remove();
    });
}
