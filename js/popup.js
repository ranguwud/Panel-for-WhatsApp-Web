/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Add event listeners
document.addEventListener("DOMContentLoaded", popupOpened);
window.addEventListener("unload", popupClosed, true);
window.addEventListener("message", receiveUnsentMessages, false);


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
    var background = browser.extension.getBackgroundPage();
    data = JSON.parse(event.data);
    for (var key in data) {
        if (data.hasOwnProperty(key)) {           
            background.messageStore[key] = data[key];
        }
    }
}
