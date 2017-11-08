var target = document.body;

var chatObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        console.log(mutation.target.className);
    });
});

var appWrapperObserver = new MutationObserver(function(mutations, observer) {
    mutations[0].target.querySelectorAll('div.chat').forEach(function(node) {
        chatObserver.observe(node, {attributes: true});
    });
});

var appObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutuation) {
        target=document.body.querySelector('div#app').querySelector('div.app-wrapper');
        appWrapperObserver.observe(target, {childList: true})
    });
});

var bodyObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        target = document.body.querySelector('div#app');
        appObserver.observe(target, {childList: true});
    });
});

bodyObserver.observe(target, {childList: true});

