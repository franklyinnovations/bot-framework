"use strict";
const _ = require("lodash");
class Script {
    constructor(scriptName) {
        this.dialogs = [];
        this.name = scriptName;
        return this;
    }
    dialog(dialogFunction) {
        this.dialogs.push(dialogFunction);
        return this;
    }
    run(session) {
        const currentStep = session.private.conversation.scripts[this.name].step || 0;
        const dialogsLeft = this.dialogs.slice(currentStep);
        const currentDialog = _.head(dialogsLeft);
        const remainingDialogs = _.tail(dialogsLeft);
        const nextDialog = () => {
            session.private.conversation.scripts[this.name].step += 1;
            return this.run(session);
        };
        return currentDialog(session.conversation, nextDialog);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Script;
