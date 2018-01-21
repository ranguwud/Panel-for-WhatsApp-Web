/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var Child;

// Add event listeners
document.addEventListener("DOMContentLoaded", popupOpened);
window.addEventListener("unload", popupClosed, true);


// Function definitions
function popupOpened(event) {
    var background = browser.extension.getBackgroundPage();
    var uuid = browser.extension.getURL("").split("/")[2];

    background.popupOpened();
    Child = new IChild(uuid);
    Child._debug = true;
    document.getElementById("popup-iframe").className = uuid;
    document.getElementById("popup-iframe").src = "https://web.whatsapp.com/";
}

function popupClosed(event) {
    document.getElementById("popup-iframe").src = "about:blank";
    var background = browser.extension.getBackgroundPage();
    background.popupClosed();
}
