class IParent {
    constructor (uuid) {
        this._uuid = uuid;
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
    
    log(message) {
        this.sendMessage("log", message);
    }
}
