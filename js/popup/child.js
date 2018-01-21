class IChild {
    constructor (uuid) {
        this._uuid = uuid;
        this._debug = false;
        window.addEventListener("message", function(self) {
            return function(event) {
                return self.receiveMessage(event);
            }
        } (this), false);
    }
    
    get uuid() {
        return this._uuid
    }

    sendMessage(type, content) {
        var messageDict = {};
        messageDict[type] = content;
        var message = JSON.stringify(messageDict);
        document.getElementById("popup-iframe").contentWindow.postMessage(message, "https://web.whatsapp.com");
    }
    
    receiveMessage(event) {
        if (event.origin !== "https://web.whatsapp.com")
            return;
        var message = JSON.parse(event.data);

        Object.entries(message).forEach(([key, value]) => {
            if (key === "log")
                this._logMessage(value);
            if (key === "debug")
                this._debugMessage(value);
            if (key === "storeMessage")
                this._storeMessage(value);
            if (key === "requestUnsentMessages")
                this._requestUnsentMessages(value);
        });
    }

    provideUnsentMessages() {
        var background = browser.extension.getBackgroundPage();
        this.sendMessage("provideUnsentMessages", background.messageStore);
    }

    _logMessage(str) {
        console.log(str);
    }

    _debugMessage(str) {
        if (this._debug) {
            console.log(str);
        }
    }
    
    _storeMessage(data) {
        var background = browser.extension.getBackgroundPage();
        Object.entries(data).forEach(([key, value]) => {
            background.messageStore[key] = value;
        });
        this._debugMessage(background.messageStore);
    }
    
    _requestUnsentMessages(data) {
        console.log("Request received");
        this.provideUnsentMessages();
    }
}
