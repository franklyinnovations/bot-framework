"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var outgoing_1 = require("./outgoing");
var Promise = require("bluebird");
;
var StopException = (function (_super) {
    __extends(StopException, _super);
    function StopException(m) {
        if (m === void 0) { m = 'Stop'; }
        var _this = _super.call(this, m) || this;
        // Set the prototype explicitly.
        Object.setPrototypeOf(_this, StopException.prototype);
        return _this;
    }
    return StopException;
}(Error));
var Script = (function () {
    function Script(bot, scriptName) {
        this.dialogs = [];
        this.bot = bot;
        this.name = scriptName;
        return this;
    }
    Script.prototype.run = function (incoming, nextScript, scriptData) {
        var _this = this;
        if (scriptData === void 0) { scriptData = null; }
        var topic = incoming.intent.topic;
        var action = incoming.intent.action;
        var top = _.slice(this.dialogs, 0, incoming.user.scriptStage);
        var bottom = _.slice(this.dialogs, incoming.user.scriptStage);
        var validDialogs = bottom;
        var forcedDialogs = top.filter(function (shell) { return shell.force; }).filter(this.filterDialog(topic, action));
        var response = new outgoing_1.default(this.bot, incoming.user);
        var runUnforced = function () {
            return Promise.resolve()
                .then(function () { return _this.callScript(incoming, response, validDialogs, nextScript, incoming.user.scriptStage); })
                .catch(function (err) {
                if (err instanceof StopException) {
                    return;
                }
                throw err;
            });
        };
        return Promise.resolve()
            .then(function () { return _this.callScript(incoming, response, forcedDialogs, runUnforced, 0); })
            .catch(function (err) {
            if (err instanceof StopException) {
                return;
            }
            throw err;
        });
        ;
    };
    Script.prototype.addDialog = function () {
        var name = null;
        var dialogFunction = arguments[0];
        if (arguments.length === 2) {
            name = arguments[0];
            dialogFunction = arguments[1];
        }
        this.dialogs.push({
            force: false,
            function: dialogFunction.bind(this),
            intent: null,
            expect: null,
            name: name,
        });
        return this;
    };
    Script.prototype.expect = function () {
        var type = 'text';
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
            intent: null,
            expect: {
                type: type,
                catch: null,
            },
            function: theFunction.bind(this),
            force: false,
            name: null,
        };
        this.dialogs.push(dialog);
        return this;
    };
    Script.prototype.catch = function (dialogFunction) {
        var lastDialog = _.last(this.dialogs);
        if (lastDialog.expect !== null) {
            lastDialog.expect.catch = dialogFunction.bind(this);
        }
        return this;
    };
    Script.prototype.match = function () {
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
        // the magic
        this.dialogs.push({
            force: false,
            function: theFunction.bind(this),
            intent: intent,
            expect: null,
            name: null,
        });
        return this;
    };
    Object.defineProperty(Script.prototype, "force", {
        get: function () {
            _.last(this.dialogs).force = true;
            return this;
        },
        enumerable: true,
        configurable: true
    });
    Script.prototype.filterDialog = function (topic, action) {
        return function (shell) {
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
        var isValid = this.filterDialog(request.intent.topic, request.intent.action);
        if (isValid(currentDialog) === false) {
            // console.log('not valid, move on');
            return Promise.resolve(this.callScript(request, response, nextDialogs, nextScript, thisStep + 1));
        }
        var __this = this;
        return Promise.resolve()
            .then(function () { return currentScript(request, response, stopFunction); })
            .then(function () {
            // console.log('thisStep', thisStep, Math.max(request.user.scriptStage, thisStep + 1));
            request.user.scriptStage = Math.max(request.user.scriptStage, thisStep + 1);
            if (_.head(nextDialogs).expect === null) {
                return __this.callScript(request, response, nextDialogs, nextScript, thisStep + 1);
            }
        })
            .catch(function (err) {
            if (currentDialog.expect !== null && currentDialog.expect.catch !== null) {
                return Promise.resolve()
                    .then(function () { return currentDialog.expect.catch(request, response, stopFunction); })
                    .then(function () { return stopFunction(); });
            }
            throw err;
        });
    };
    return Script;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Script;
function stopFunction() {
    throw new StopException();
}
