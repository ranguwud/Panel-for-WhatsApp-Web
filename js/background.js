/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Declare variables
messageStore = {};


// Add event listeners
window.addEventListener("message", receiveUnreadMessages, false);
browser.webRequest.onHeadersReceived.addListener(removeResponseHeaders, {"urls": ["*://*.web.whatsapp.com/*"]}, ["blocking", "responseHeaders"]);


// Function definitions
function receiveUnreadMessages(event) {
    if (event.origin !== "https://web.whatsapp.com")
        return;
    browser.browserAction.setBadgeText({text: event.data});
}

function popupOpened() {
    browser.browserAction.setBadgeText({text: ""});
    document.getElementById("background-iframe").src = "about:blank";
}

function popupClosed() {
    document.getElementById("background-iframe").src = "https://web.whatsapp.com/";
}

function removeResponseHeaders(details) {
    if (details.tabId > -1)
        return;
    var headers = details.responseHeaders;
    var indices = new Array();
    for (var i = 0; i < headers.length; ++i) {
        var name = headers[i].name.toLowerCase();
        if (name === 'x-frame-options' || name === 'frame-options') {
            indices.push(i);
        }
    }
    for (var i = indices.length - 1; i >= 0; --i) {
        headers.splice(indices[i], 1);
    }
    return {"responseHeaders": headers};
}
