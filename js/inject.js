/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Attach bodyObserver, if loaded in iframe
if (inIframe()) {
    var target = document.body;
    var bodyObserver = new MutationObserver(bodyMutated);
    bodyObserver.observe(target, {childList: true});
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
    //TODO: * -> moz-extension://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    if (unreadMessageCount > 0) {
        if (unreadMessageCount < 100) {
            window.top.postMessage(unreadMessageCount.toString(), '*');
        } else {
            window.top.postMessage('99+', '*');
        }
    } else {
        window.top.postMessage('', '*');
    }
}

function chatMutated(mutations) {
    mutations.forEach(function(mutation) {
        var count = countUnreadMessages();
        postUnreadMessages(count);
    });
}

function appWrapperMutated(mutations, observer) {
    mutations.some(function(mutation) {
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
    });
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
