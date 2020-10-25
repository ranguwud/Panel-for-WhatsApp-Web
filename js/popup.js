/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Add event listeners
document.addEventListener("DOMContentLoaded", popupOpened);
window.addEventListener("unload", popupClosed, true);
window.addEventListener("message", receiveMessages, false);
// Set frame class name.
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("popup-iframe").className = browser.extension.getURL("").split("/")[2];
}, false);

// React to opening popup
function popupOpened(event) {
    var background = browser.extension.getBackgroundPage();
    background.popupOpened();
    document.getElementById("popup-iframe").src = "https://web.whatsapp.com/";
}

// React to closing popup
function popupClosed(event) {
    document.getElementById("popup-iframe").src = "about:blank";
    var background = browser.extension.getBackgroundPage();
    background.popupClosed();
}

// Receive messages from inject.js
function receiveMessages(event) {
    if (event.origin !== "https://web.whatsapp.com")
        return;
    var message = JSON.parse(event.data);
    
    if ("debug" in message) {
        console.log("DEBUG:", message["debug"]);
    }
    if ("draft" in message) {
        var data = message["draft"];
        var background = browser.extension.getBackgroundPage();
        for (var key in data) {
            if (data.hasOwnProperty(key)) {           
                background.messageStore[key] = data[key];
            }
        }
    }
    if ("status" in message) {
        if (message["status"] === "request-message-drafts") {
            var background = browser.extension.getBackgroundPage();
            postMessage("draft", background.messageStore);
        }
    }
}

// Send messages to inject.js
function postMessage(messageType, messageContent) {
    var message = {};
    message[messageType] = messageContent;
    document.getElementById("popup-iframe").contentWindow.postMessage(JSON.stringify(message), 'https://web.whatsapp.com');
}
