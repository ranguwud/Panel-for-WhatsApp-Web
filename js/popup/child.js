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

    receiveMessage(event) {
        if (event.origin !== "https://web.whatsapp.com")
            return;
        var message = JSON.parse(event.data);

        Object.entries(message).forEach(([key, value]) => {
            if (key === "log")
                this.logMessage(value);
            if (key === "debug")
                this.debugMessage(value);
        });
    }

    logMessage(str) {
        console.log(str);
    }

    debugMessage(str) {
        if (this._debug) {
            console.log(str);
        }
    }
}
