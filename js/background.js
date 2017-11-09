function receiveMessage(event)
{
    if (event.origin !== "https://web.whatsapp.com")
        return;
    console.log(event.data);
}

window.addEventListener("message", receiveMessage, false);

browser.webRequest.onHeadersReceived.addListener(function(info) {
    if (info.tabId > -1) return;
    var headers = info.responseHeaders;
    for (var i = 0; i < headers.length; i++) {
        var name = headers[i].name.toLowerCase();
        if (name === 'x-frame-options' || name === 'frame-options') {
            headers.splice(i, 1);
            return {"responseHeaders": headers};
        }
    }
}, {"urls": ["*://*.web.whatsapp.com/*"]}, ["blocking", "responseHeaders"]);
