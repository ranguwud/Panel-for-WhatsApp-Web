/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var Parent;

// Attach bodyObserver, if loaded in iframe
if (inIframe()) {
    var target = document.body;
    var bodyObserver = new MutationObserver(bodyMutated);
    bodyObserver.observe(target, {childList: true});
    var uuid = window.frameElement.className;
    Parent = new IParent(uuid);
    Parent.debug("Parent interface initialized.");
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
    var count = 0;
    var nodes = document.body.querySelectorAll('div#app > div.app-wrapper div.chat div.chat-secondary div.chat-meta');
    nodes.forEach(function(node) {
        var unreadSpan = node.querySelector('span:first-child > div:last-child > span');
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

function postUnreadMessages(unreadMessageCount) {
    if (unreadMessageCount > 0) {
        if (unreadMessageCount < 100) {
            Parent.showMessageCount(unreadMessageCount.toString());
        } else {
            Parent.showMessageCount('99+');
        }
    } else {
        Parent.showMessageCount('');
    }
}

function chatMutated(mutations) {
    mutations.forEach(function(mutation) {
        var count = countUnreadMessages();
        postUnreadMessages(count);
    });
}

function textMutated(mutations) {
    Parent.debug("Text mutated");
    mutations.some(function(mutation) {
        title = document.body.querySelector("div.chat.active div.chat-title > span").title;
        //TODO: Can't that be done using mutation.target??
        text = encodeURI(document.body.querySelector("#main footer div.pluggable-input-body").innerHTML);
        var data = {};
        data[title] = text;
        Parent.storeMessage(data);
        return true;
    });
}

function placeholderMutated(mutations) {
    Parent.debug("Placeholder mutated");
    mutations.some(function(mutation) {
        title = document.body.querySelector("div.chat.active div.chat-title > span").title;
        text = encodeURI(mutation.target.parentNode.querySelector("div.pluggable-input-body").innerHTML);
        var data = {};
        data[title] = text;
        Parent.storeMessage(data);
        return true;
    });
}

function chatPaneMutated(mutations) {
    Parent.debug("Chat pane mutated");
    var target = document.body.querySelector("#main footer div.pluggable-input-body");
    var textObserver = new MutationObserver(textMutated);
    textObserver.observe(target, {characterData: true, subtree: true});
    var target = document.body.querySelector("#main footer div.pluggable-input-placeholder");
    var textObserver = new MutationObserver(placeholderMutated);
    textObserver.observe(target, {attributes: true});
}

function appWrapperMutated(mutations, observer) {
    Parent.debug("App wrapper mutated");
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
            target = mutation.target.querySelector('div.app.two > div:last-child');
            var chatPaneObserver = new MutationObserver(chatPaneMutated);
            chatPaneObserver.observe(target, {childList: true});
            
            Parent.debug("Requesting unsent messages");
            Parent.requestUnsentMessages();
            
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

function appMutated(mutations, observer) {
    Parent.debug("App mutated");
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
    Parent.debug("Body mutated");
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
