var chatObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        console.log('foo');
    });
});

var appWrapperObserver = new MutationObserver(function(mutations, observer) {
    mutations.some(function(mutation) {
        targets = mutation.target.querySelectorAll('div.chat div.chat-secondary div.chat-meta span:first-child');
        if (targets.length > 0) {
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
