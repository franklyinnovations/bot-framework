"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var Promise = require("bluebird");
var message_1 = require("./types/message");
var StopScriptReasons;
(function (StopScriptReasons) {
    StopScriptReasons[StopScriptReasons["Called"] = 0] = "Called";
    StopScriptReasons[StopScriptReasons["NewScript"] = 1] = "NewScript";
    StopScriptReasons[StopScriptReasons["ExpectCaught"] = 2] = "ExpectCaught";
})(StopScriptReasons = exports.StopScriptReasons || (exports.StopScriptReasons = {}));
var StopException = (function (_super) {
    __extends(StopException, _super);
    function StopException(reason) {
        var _this = _super.call(this, "Script stopped due to " + StopScriptReasons[reason]) || this;
        // Set the prototype explicitly.
        Object.setPrototypeOf(_this, StopException.prototype);
        _this.reason = reason;
        return _this;
    }
    return StopException;
}(Error));
exports.StopException = StopException;
var EndScriptReasons;
(function (EndScriptReasons) {
    EndScriptReasons[EndScriptReasons["Called"] = 0] = "Called";
    EndScriptReasons[EndScriptReasons["Reached"] = 1] = "Reached";
})(EndScriptReasons = exports.EndScriptReasons || (exports.EndScriptReasons = {}));
var EndScriptException = (function (_super) {
    __extends(EndScriptException, _super);
    function EndScriptException(reason) {
        var _this = _super.call(this, "End of script due to " + EndScriptReasons[reason]) || this;
        // Set the prototype explicitly.
        Object.setPrototypeOf(_this, EndScriptException.prototype);
        _this.reason = reason;
        return _this;
    }
    return EndScriptException;
}(Error));
exports.EndScriptException = EndScriptException;
var Script = (function () {
    function Script(bot, scriptName) {
        this.dialogs = [];
        // tslint:disable-next-line:variable-name
        this._begin = null;
        this.bot = bot;
        this.name = scriptName;
        this.button = this._button.bind(this);
        this.button.always = this._buttonAlways.bind(this);
        this.expect = this._expect.bind(this);
        this.expect.text = this.expectText.bind(this);
        this.expect.button = this._buttonExpect.bind(this);
        this.intent = this._intent.bind(this);
        this.intent.always = this._intentAlways.bind(this);
        return this;
    }
    Script.prototype.run = function (incoming, outgoing, nextScript, step) {
        var _this = this;
        if (step === void 0) { step = incoming.user.scriptStage; }
        var topic = incoming.intent.topic;
        var action = incoming.intent.action;
        var top = _.slice(this.dialogs, 0, Math.max(0, step));
        var bottom = _.slice(this.dialogs, Math.max(0, step));
        var validDialogs = bottom;
        var forcedDialogs = top.filter(function (shell) { return shell.force; }).filter(function (shell) {
            switch (shell.type) {
                case 'intent':
                    return _this.filterDialog(topic, action)(shell);
                case 'dialog':
                    return shell.force;
                case 'button':
                    return shell.force;
                case 'expect':
                    return false;
                default:
                    throw new Error('Unknown Dialog type');
            }
        });
        var runUnforced = function () {
            return Promise.resolve()
                .then(function () { return _this.callScript(incoming, outgoing, validDialogs, nextScript, step); });
        };
        return Promise.resolve()
            .then(function () {
            if (step === -1) {
                incoming.user.scriptStage = 0;
                if (_this._begin !== null) {
                    return _this._begin(incoming, outgoing, stopFunction);
                }
            }
        })
            .then(function () { return _this.callScript(incoming, outgoing, forcedDialogs, runUnforced, 0); });
    };
    Script.prototype.begin = function (dialogFunction) {
        this._begin = dialogFunction;
        return this;
    };
    Script.prototype.dialog = function () {
        var name = null;
        var dialogFunction = arguments[0];
        if (arguments.length === 2) {
            name = arguments[0];
            dialogFunction = arguments[1];
        }
        var dialog = {
            type: 'dialog',
            force: false,
            function: dialogFunction.bind(this),
            name: name,
            blocking: false,
        };
        this.dialogs.push(dialog);
        return this;
    };
    Script.prototype._expect = function (type, dialogFunction) {
        var theFunction = null;
        switch (arguments.length) {
            case 1:
                theFunction = arguments[0];
                break;
            case 2:
                type = arguments[0];
                theFunction = arguments[1];
                break;
            default:
                throw new Error('Bad function arguments');
        }
        var dialog = {
            type: 'expect',
            expect: {
                type: type,
                catch: null,
            },
            function: theFunction.bind(this),
            force: false,
            blocking: true,
        };
        this.dialogs.push(dialog);
        return this;
    };
    Script.prototype.expectText = function (dialogFunction) {
        return this._expect(message_1.MessageTypes.text, dialogFunction);
    };
    Script.prototype.catch = function (dialogFunction) {
        var lastDialog = _.last(this.dialogs);
        if (lastDialog.type !== 'expect') {
            throw new Error('catch must be after expect');
        }
        if (lastDialog.expect !== null) {
            lastDialog.expect.catch = dialogFunction.bind(this);
        }
        return this;
    };
    Script.prototype._intent = function () {
        var intent = null;
        var theFunction = null;
        switch (arguments.length) {
            case 0:
                return this;
            case 1:
                theFunction = arguments[0];
                break;
            case 2:
                intent = {
                    action: null,
                    topic: arguments[0],
                };
                theFunction = arguments[1];
                break;
            case 3:
                intent = {
                    action: arguments[1],
                    topic: arguments[0],
                };
                theFunction = arguments[2];
                break;
            default:
                throw new Error('Incorect argument count');
        }
        var dialog = {
            type: 'intent',
            force: false,
            function: theFunction.bind(this),
            intent: intent,
            blocking: false,
        };
        this.dialogs.push(dialog);
        return this;
    };
    Script.prototype._intentAlways = function () {
        this._intent.apply(this, arguments);
        _.last(this.dialogs).force = true;
        return this;
    };
    Script.prototype._button = function () {
        var buttonPayload = null;
        var theFunction = null;
        switch (arguments.length) {
            case 1:
                buttonPayload = null;
                theFunction = arguments[0];
                break;
            case 2:
                buttonPayload = arguments[0];
                theFunction = arguments[1];
                break;
            default:
                throw new Error('bad arguments');
        }
        var dialog = {
            type: 'button',
            force: false,
            function: theFunction.bind(this),
            button: buttonPayload,
            blocking: false,
        };
        this.dialogs.push(dialog);
        return this;
    };
    Script.prototype._buttonAlways = function () {
        this._button.apply(this, arguments);
        _.last(this.dialogs).force = true;
        return this;
    };
    Script.prototype._buttonExpect = function () {
        this._button.apply(this, arguments);
        _.last(this.dialogs).blocking = true;
        return this;
    };
    Script.prototype.filterDialog = function (topic, action) {
        return function (shell) {
            if (shell.type !== 'intent') {
                return;
            }
            if (shell.intent === null) {
                return true;
            }
            if (shell.intent.action === null && shell.intent.topic === topic) {
                return true;
            }
            if (shell.intent.action === action && shell.intent.topic === topic) {
                return true;
            }
            return false;
        };
    };
    Script.prototype.callScript = function (request, response, dialogs, nextScript, thisStep) {
        if (dialogs.length === 0) {
            return nextScript();
        }
        var currentDialog = _.head(dialogs);
        var nextDialogs = _.tail(dialogs);
        var currentScript = currentDialog.function;
        if (currentDialog.type === 'intent' && this.filterDialog(request.intent.topic, request.intent.action)(currentDialog) === false) {
            return Promise.resolve(this.callScript(request, response, nextDialogs, nextScript, thisStep + 1));
        }
        if (currentDialog.type === 'button') {
            if (request.message.type !== 'postback') {
                if (currentDialog.blocking === true) {
                    stopFunction();
                }
                else {
                    return Promise.resolve(this.callScript(request, response, nextDialogs, nextScript, thisStep + 1));
                }
            }
            else if (request.message.type === 'postback' && request.message.payload !== currentDialog.button) {
                if (currentDialog.blocking === true) {
                    stopFunction();
                }
                else {
                    return Promise.resolve(this.callScript(request, response, nextDialogs, nextScript, thisStep + 1));
                }
            }
        }
        // tslint:disable-next-line:variable-name
        var __this = this;
        return Promise.resolve()
            .then(function () {
            if (currentDialog.type === 'expect') {
                if (currentDialog.expect.type !== request.message.type) {
                    console.log('expect type mismatch');
                    return stopFunction(StopScriptReasons.ExpectCaught);
                }
            }
        })
            .then(function () { return currentScript(request, response, stopFunction); })
            .then(function () {
            if (nextDialogs.length === 0) {
                throw new EndScriptException(EndScriptReasons.Reached);
            }
            // console.log('thisStep', thisStep, Math.max(request.user.scriptStage, thisStep + 1));
            request.user.scriptStage = Math.max(request.user.scriptStage, thisStep + 1);
            var dialog = _.head(nextDialogs);
            if (dialog.type === 'dialog' || dialog.type === 'intent') {
                return __this.callScript(request, response, nextDialogs, nextScript, thisStep + 1);
            }
        })
            .catch(function (err) {
            if (err instanceof StopException && currentDialog.type === 'expect' && currentDialog.expect !== null && currentDialog.expect.catch !== null) {
                return Promise.resolve()
                    .then(function () { return currentDialog.expect.catch(request, response, stopFunction); })
                    .then(function () { return stopFunction(StopScriptReasons.ExpectCaught); });
            }
            throw err;
        });
    };
    return Script;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Script;
function stopFunction(reason) {
    if (reason === void 0) { reason = StopScriptReasons.Called; }
    throw new StopException(reason);
}
exports.stopFunction = stopFunction;
