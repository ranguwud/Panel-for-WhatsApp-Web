/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Add event listeners
document.addEventListener("DOMContentLoaded", popupOpened);
window.addEventListener("unload", popupClosed, true);
window.addEventListener("message", receiveUnsentMessages, false);
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("popup-iframe").className = browser.extension.getURL("").split("/")[2];
}, false);

// Function definitions
function popupOpened(event) {
    var background = browser.extension.getBackgroundPage();
    background.popupOpened();
    document.getElementById("popup-iframe").src = "https://web.whatsapp.com/";
}

function popupClosed(event) {
    document.getElementById("popup-iframe").src = "about:blank";
    var background = browser.extension.getBackgroundPage();
    background.popupClosed();
}

function receiveUnsentMessages(event) {
    if (event.origin !== "https://web.whatsapp.com")
        return;
    var message = JSON.parse(event.data);
    
    if ("debug" in message) {
        console.log("DEBUG:", message["debug"]);
    }
    if ("message" in message) {
        var data = JSON.parse(message["message"]);
        var background = browser.extension.getBackgroundPage();
        for (var key in data) {
            if (data.hasOwnProperty(key)) {           
                background.messageStore[key] = data[key];
            }
        }
    }
    if ("state" in message) {
        if (message["state"] == "ready") {
            var background = browser.extension.getBackgroundPage();
            var msg = JSON.stringify(background.messageStore);
            document.getElementById("popup-iframe").contentWindow.postMessage(msg, 'https://web.whatsapp.com');
        }
    }
}
