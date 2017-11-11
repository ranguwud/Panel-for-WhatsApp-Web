/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.addEventListener("DOMContentLoaded", function(event) {
    var background = browser.extension.getBackgroundPage();
    background.popupOpened();
    document.getElementById("popup-iframe").src = "https://web.whatsapp.com/";
});

window.addEventListener("unload", function(event) {
    document.getElementById("popup-iframe").src = "about:blank";
    var background = browser.extension.getBackgroundPage();
    background.popupClosed();
}, true);
