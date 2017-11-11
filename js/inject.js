/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

if (inIframe()) {
    var countUnreadMessages = function() {
        count = 0;
        nodes = document.body.querySelectorAll('div#app > div.app-wrapper div.chat div.chat-secondary div.chat-meta span:first-child > div > span');
        nodes.forEach(function(node) {
            current = Number(node.innerHTML);
            if (!isNaN(current)) {
                count += current;
            }
        });
        //TODO: * -> moz-extension://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        if (count > 0) {
            if (count < 100) {
                window.top.postMessage(count.toString(), '*');
            } else {
                window.top.postMessage('99+', '*');
            }
        } else {
            window.top.postMessage('', '*');
        }
    };


    var chatObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            countUnreadMessages();
        });
    });

    var appWrapperObserver = new MutationObserver(function(mutations, observer) {
        mutations.some(function(mutation) {
            targets = mutation.target.querySelectorAll('div.chat div.chat-secondary div.chat-meta span:first-child');
            if (targets.length > 0) {
                countUnreadMessages();
                targets.forEach(function(target) {
                    chatObserver.observe(target, {childList: true, characterData: true, subtree: true});
                });
                observer.disconnect();
                return true;
            }
        });
    });

    var appObserver = new MutationObserver(function(mutations, observer) {
        mutations.some(function(mutation) {
            target = mutation.target.querySelector('div.app-wrapper');
            if (target) {
                appWrapperObserver.observe(target, {childList: true})
                observer.disconnect();
                return true;
            }
        });
    });

    var bodyObserver = new MutationObserver(function(mutations, observer) {
        mutations.some(function(mutation) {
            target = mutation.target.querySelector('div#app');
            if (target) {
                appObserver.observe(target, {childList: true});
                observer.disconnect();
                return true;
            }
        });
    });

    var target = document.body;
    bodyObserver.observe(target, {childList: true});
}
