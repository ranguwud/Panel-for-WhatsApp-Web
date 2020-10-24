/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if (inIframe()) {
    // Attach bodyObserver
    var target = document.body;
    var bodyObserver = new MutationObserver(bodyMutated);
    bodyObserver.observe(target, {childList: true});
    // Get UUID of extension
    var uuid = window.frameElement.className;
    // Contact of last selected chat
    var lastContact = "";
    // Signal successful injection
    postDebugMessage("JS injection successful");
}

// If present, attach appObserver to 'div#app', then disconnect bodyObserver.
function bodyMutated(mutations, observer) {
    mutations.some(function(mutation) {
        target = mutation.target.querySelector('div#app');
        if (target) {
            var appObserver = new MutationObserver(appMutated);
            appObserver.observe(target, {childList: true});
            observer.disconnect();
            postDebugMessage("MutationObserver appMutated attached.");
            return true;
        }
    });
}

// If present, attach appWrapperMutated to 'div.app-wrapper-web', then disconnect appObserver.
function appMutated(mutations, observer) {
    mutations.some(function(mutation) {
        target = mutation.target.querySelector('div.app-wrapper-web');
        if (target) {
            var appWrapperObserver = new MutationObserver(appWrapperMutated);
            appWrapperObserver.observe(target, {childList: true})
            observer.disconnect();
            postDebugMessage("MutationObserver appWrapperMutated attached.");
            return true;
        }
    });
}

// In background page:
//   To all open chats attach chatMutated, then disconnect appWrapperObserver.
//   Send number of unread messages to background.js
// In popup page:
//   If present, attach chatPaneMutated to 'div.app.two', then disconnect appWrapperObserver
//   Send state ready to popup.js
function appWrapperMutated(mutations, observer) {
    mutations.some(function(mutation) {
        if (window.frameElement.id == "background-iframe") {
            chats = document.body.querySelectorAll('div#pane-side > div > div > div > div');
            if (chats.length > 0) {
                postUnreadMessageCount(getUnreadMessageCount());
                chats.forEach(function(chat) {
                    var target = chat.querySelector('div > div > div:last-child > div:last-child > div:last-child > span:first-child');
                    var chatObserver = new MutationObserver(chatMutated);
                    chatObserver.observe(target, {childList: true, characterData: true, subtree: true});
                });
                observer.disconnect();
                return true;
            }
        } else {
            target = mutation.target.querySelector('div#side');//'div.app.two');
            if (target) {
                var chatPaneObserver = new MutationObserver(chatPaneMutated);
                chatPaneObserver.observe(target, {attributes: true, subtree: true});
                observer.disconnect();
                postDebugMessage("MutationObserver chatPaneMutated attached.");

                //window.addEventListener("message", pasteUnsentMessage, false);

                postStatusMessage("ready");
                return true;
            }
        }
    });
}

// When chat is mutated, count and send unread messages
function chatMutated(mutations) {
    mutations.forEach(function(mutation) {
        postUnreadMessageCount(getUnreadMessageCount());
    });
}

// If chat pane is mutated and a new chat selected, attach textMutated and placeholderMutated
function chatPaneMutated(mutations) {
    var currentContact = getCurrentContact();
    if (currentContact !== lastContact) {
        lastContact = currentContact;
        var target = document.body.querySelector("#main div.copyable-area div.copyable-text.selectable-text");
        if (target) {
            var textObserver = new MutationObserver(textMutated);
            textObserver.observe(target, {characterData: true, subtree: true});
            postDebugMessage("MutationObserver textMutated attached for contact " + currentContact + ".");
        }
    }

/*
    var target = document.body.querySelector("#main footer div.pluggable-input-placeholder");
    if (target) {
        var textObserver = new MutationObserver(placeholderMutated);
        textObserver.observe(target, {attributes: true});
        var message = {"debug": "MutationObserver placeholderMutated attached."}
        window.top.postMessage(JSON.stringify(message), 'moz-extension://' + uuid + '/');
    }
*/
}

function textMutated(mutations) {
    mutations.some(function(mutation) {
        postMessageDraft(getCurrentContact(), getMessageDraft());
        return true;
    });
}

/*
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
*/



// Function definitions
function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

function getCurrentContact() {
    target = document.body.querySelector("#main header > div:nth-child(2) > div > div > span");
    if (target) {
        return DOMPurify.sanitize(target.title);
    } else {
        return "";
    }
}

function getMessageDraft() {
    target = document.body.querySelector("#main div.copyable-area div.copyable-text.selectable-text");
    if (!target)
        return "";
        
    text = DOMPurify.sanitize(target.innerHTML).trim();
    while (text.endsWith("<br>")) {
        text = text.slice(0, -4).trim();
    }
    
    return encodeURI(text);
}

function getUnreadMessageCount() {
    var count = 0;
    var nodes = document.body.querySelectorAll('div#pane-side > div > div > div > div');
    nodes.forEach(function(node) {
        var unreadSpan = node.querySelector('div > div > div:last-child > div:last-child > div:last-child > span:first-child');
        if (unreadSpan) {
            var spans = node.querySelectorAll('span:first-child > div > span');
            var muted = false;
            //TODO: Replace this by a function like Array.some
            for (var i = 0; i < spans.length; ++i) {
                if (spans[i].getAttribute("data-icon") === "muted") {
                    muted = true;
                    break;
                }
            }
            if (!muted) {
                var current = Number(unreadSpan.innerText);
                if (!isNaN(current)) {
                    count += current;
                }
            }
        }
    });
    return count;
}

function postMessage(messageType, messageContent) {
    var message = {};
    message[messageType] = messageContent;
    window.top.postMessage(JSON.stringify(message), 'moz-extension://' + uuid + '/');
}

function postDebugMessage(messageContent) {
    postMessage("debug", messageContent);
}

function postStatusMessage(messageContent) {
    postMessage("status", messageContent);
}

function postMessageDraft(contact, draft) {
    var messageContent = {};
    messageContent[contact] = draft;
    postMessage("draft", messageContent);
}

function postUnreadMessageCount(count) {
    if (count > 0) {
        if (count < 100) {
            postMessage("badge", count.toString());
        } else {
            postMessage("badge", '99+');
        }
    } else {
        postMessage("badge", '');
    }
}

/*
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
                        node.innerHTML = DOMPurify.sanitize(decodeURI(messages[recipient]));
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
*/
