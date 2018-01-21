class IParent {
    constructor (uuid) {
        this._uuid = uuid;
        window.addEventListener("message", function(self) {
            return function(event) {
                return self.receiveMessage(event);
            }
        } (this), false);
    }
    
    get uuid() {
        return this._uuid;
    }

    sendMessage(type, content) {
        var messageDict = {};
        messageDict[type] = content;
        var message = JSON.stringify(messageDict);
        window.top.postMessage(message, 'moz-extension://' + this.uuid + '/');
    }
    
    receiveMessage(event) {
        if (event.origin !== 'moz-extension://' + this.uuid)
            return;
        var message = JSON.parse(event.data);

        Object.entries(message).forEach(([key, value]) => {
            if (key === "provideUnsentMessages")
                this._provideUnsentMessages(value);
        });
    }

    log(message) {
        this.sendMessage("log", message);
    }
    
    debug(message) {
        this.sendMessage("debug", message);
    }

    showMessageCount(str) {
        this.sendMessage("showMessageCount", str);
    }
    
    storeMessage(data) {
        this.sendMessage("storeMessage", data);
    }
    
    requestUnsentMessages() {
        this.sendMessage("requestUnsentMessages", "");
    }
    
    _provideUnsentMessages(messages) {
        this.debug("Received unsent messages");
        for (var recipient in messages) {
            if (!messages[recipient] == "") {
                Parent.debug("Restoring message to " + recipient);
                var targets = document.body.querySelectorAll('div.chat span.emojitext.ellipsify');
                Parent.debug(targets.length);
                targets.forEach(function(target) {
                    if (recipient === target.title) {
                        Parent.debug("Found chat.");
                        function triggerMouseEvent (node, eventType) {
                            var clickEvent = document.createEvent ('MouseEvents');
                            clickEvent.initEvent (eventType, true, true);
                            node.dispatchEvent (clickEvent);
                        }
                        Parent.debug("Select chat " + recipient);
                        triggerMouseEvent(target, "mousedown");

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
}
