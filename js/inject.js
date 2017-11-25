/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Attach bodyObserver, if loaded in iframe
if (inIframe()) {
    var target = document.body;
    var bodyObserver = new MutationObserver(bodyMutated);
    bodyObserver.observe(target, {childList: true});
    var uuid = window.frameElement.className;
}


// Function definitions
function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

function countUnreadMessages() {
    count = 0;
    nodes = document.body.querySelectorAll('div#app > div.app-wrapper div.chat div.chat-secondary div.chat-meta span:first-child > div > span');
    nodes.forEach(function(node) {
        current = Number(node.innerHTML);
        if (!isNaN(current)) {
            count += current;
        }
    });
    return count;
}

function postUnreadMessages(unreadMessageCount) {
    if (unreadMessageCount > 0) {
        if (unreadMessageCount < 100) {
            window.top.postMessage(unreadMessageCount.toString(), 'moz-extension://' + uuid + '/');
        } else {
            window.top.postMessage('99+', 'moz-extension://' + uuid + '/');
        }
    } else {
        window.top.postMessage('', 'moz-extension://' + uuid + '/');
    }
}

function chatMutated(mutations) {
    mutations.forEach(function(mutation) {
        var count = countUnreadMessages();
        postUnreadMessages(count);
    });
}

function textMutated(mutations) {
    mutations.some(function(mutation) {
        title = document.body.querySelector("div.chat.active div.chat-title > span").title;
        //TODO: Can't that be done using mutation.target??
        text = encodeURI(document.body.querySelector("#main footer div.pluggable-input-body").innerHTML);
        var data = {};
        data[title] = text;
        var message = { "message": JSON.stringify(data) };
        window.top.postMessage(JSON.stringify(message), 'moz-extension://' + uuid + '/');
        return true;
    });
}

function placeholderMutated(mutations) {
    mutations.some(function(mutation) {
        title = document.body.querySelector("div.chat.active div.chat-title > span").title;
        text = encodeURI(mutation.target.parentNode.querySelector("div.pluggable-input-body").innerHTML);
        var data = {};
        data[title] = text;
        var message = { "message": JSON.stringify(data) };
        window.top.postMessage(JSON.stringify(message), 'moz-extension://' + uuid + '/');
        return true;
    });
}

function chatPaneMutated(mutations) {
    var target = document.body.querySelector("#main footer div.pluggable-input-body");
    var textObserver = new MutationObserver(textMutated);
    textObserver.observe(target, {characterData: true, subtree: true});
    var target = document.body.querySelector("#main footer div.pluggable-input-placeholder");
    var textObserver = new MutationObserver(placeholderMutated);
    textObserver.observe(target, {attributes: true});
}

function appWrapperMutated(mutations, observer) {
    mutations.some(function(mutation) {
        if (window.frameElement.id == "background-iframe") {
            targets = mutation.target.querySelectorAll('div.chat div.chat-secondary div.chat-meta span:first-child');
            if (targets.length > 0) {
                var count = countUnreadMessages();
                postUnreadMessages(count);
                targets.forEach(function(target) {
                    var chatObserver = new MutationObserver(chatMutated);
                    chatObserver.observe(target, {childList: true, characterData: true, subtree: true});
                });
                observer.disconnect();
                return true;
            }
        } else {
            target = mutation.target.querySelector('div.app.two');
            var chatPaneObserver = new MutationObserver(chatPaneMutated);
            chatPaneObserver.observe(target, {childList: true});

            var message = {"state": "ready"};
            window.top.postMessage(JSON.stringify(message), 'moz-extension://' + uuid + '/');
            var message = {"state": window.frameElement.className};
            window.top.postMessage(JSON.stringify(message), 'moz-extension://' + uuid + '/');
            
            window.addEventListener("message", pasteUnsentMessage, false);
            return true;
        }
    });
}

function waitforNode(selector, callback) {
    // Check if condition met. If not, re-check later (msec).
    node = document.body.querySelector(selector)
    while (node == null) {
        setTimeout(function() {
            waitforNode(selector, callback);
        }, 100);
        return;
    }
    // Condition finally met. callback() can be executed.
    callback();
}

function pasteUnsentMessage(event) {
    messages = JSON.parse(event.data);
    for (var recipient in messages) {
        if (!messages[recipient] == "") {
            targets = document.body.querySelectorAll('div.chat span.emojitext.ellipsify');
            targets.forEach(function(target) {
                if (recipient == target.title) {
                    function triggerMouseEvent (node, eventType) {
                        var clickEvent = document.createEvent ('MouseEvents');
                        clickEvent.initEvent (eventType, true, true);
                        node.dispatchEvent (clickEvent);
                    }
                    triggerMouseEvent (target, "mousedown");

                    waitforNode("#main footer div.pluggable-input-body", function() {
                        node = document.body.querySelector("#main footer div.pluggable-input-body");
                        node.innerHTML = decodeURI(messages[recipient]);
                        var event = new Event('input', {
                            'bubbles': true,
                            'cancelable': true
                        });
                        node.dispatchEvent(event);
                    });
                    return true;
                }
            });
        }
    }
}

function appMutated(mutations, observer) {
    mutations.some(function(mutation) {
        target = mutation.target.querySelector('div.app-wrapper');
        if (target) {
            var appWrapperObserver = new MutationObserver(appWrapperMutated);
            appWrapperObserver.observe(target, {childList: true})
            observer.disconnect();
            return true;
        }
    });
}

function bodyMutated(mutations, observer) {
    mutations.some(function(mutation) {
        target = mutation.target.querySelector('div#app');
        if (target) {
            var appObserver = new MutationObserver(appMutated);
            appObserver.observe(target, {childList: true});
            observer.disconnect();
            return true;
        }
    });
}
