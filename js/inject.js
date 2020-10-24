/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if (inIframe()) {
    // Add event listeners
    window.addEventListener("message", receiveMessages, false);
    // Attach bodyObserver
    var target = document.body;
    var bodyObserver = new MutationObserver(bodyMutated);
    bodyObserver.observe(target, {childList: true});
    // Get UUID of extension
    var uuid = window.frameElement.className;
    // Contact of last selected chat
    var lastContact = "";
    // Store of message drafts
    var messageStore = {};
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
            target = mutation.target.querySelector('div');
            if (target) {
                target.style.minHeight = "580px";
            }
            target = mutation.target.querySelector('div#side');
            if (target) {
                var chatPaneObserver = new MutationObserver(chatPaneMutated);
                chatPaneObserver.observe(target, {attributes: true, subtree: true});
                observer.disconnect();
                postDebugMessage("MutationObserver chatPaneMutated attached.");

                postStatusMessage("request-message-drafts");
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
        var target = document.body.querySelector("#main footer > div.copyable-area div.copyable-text.selectable-text");
        if (target) {
            if(pasteMessageDraft(currentContact))
                postDebugMessage("Message draft restored for " + currentContact + ".")
            var textObserver = new MutationObserver(textMutated);
            textObserver.observe(target, {characterData: true, subtree: true});
            postDebugMessage("MutationObserver textMutated attached for contact " + currentContact + ".");
        }
    }
}

function textMutated(mutations) {
    mutations.some(function(mutation) {
        var contact = getCurrentContact();
        postMessageDraft(contact, getMessageDraft(contact));
        return true;
    });
}




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

function getMessageDraft(contact) {
    target = document.body.querySelector("#main footer > div.copyable-area div.copyable-text.selectable-text");
    if (!target)
        return "";
        
    text = DOMPurify.sanitize(target.innerHTML).trim();
    while (text.endsWith("<br>")) {
        text = text.slice(0, -4).trim();
    }
    
    return encodeURI(text);
}

function pasteMessageDraft(contact) {
    if (contact in messageStore) {
        target = document.body.querySelector("#main footer > div.copyable-area div.copyable-text.selectable-text");
        if (!target)
            return false;

        text = messageStore[contact];
        delete messageStore[contact];
        target.innerHTML = decodeURI(text);
        var event = new Event('input', {
            'bubbles': true,
            'cancelable': true
        });
        target.dispatchEvent(event);
        return true;
    } else {
        return false;
    }
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

function receiveMessages(event) {
    if (event.origin !== "moz-extension://" + uuid)
        return;
    var message = JSON.parse(event.data);
    
    if ("draft" in message) {
        messageStore = message["draft"];
        postDebugMessage("Draft messages recieved from background page.");
    }
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
