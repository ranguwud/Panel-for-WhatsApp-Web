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
