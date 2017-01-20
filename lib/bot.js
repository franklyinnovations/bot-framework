"use strict";
var _ = require("lodash");
var Promise = require("bluebird");
var platform_1 = require("./types/platform");
exports.PlatformMiddleware = platform_1.PlatformMiddleware;
var memory_1 = require("./storage/memory");
var default_reducer_1 = require("./default-reducer");
var nlp_1 = require("./nlp");
var script_1 = require("./script");
var outgoing_1 = require("./outgoing");
exports.defaultClassifierDirectories = [__dirname + "/../nlp/phrases"];
var DEFAULT_SCRIPT = '';
var Botler = (function () {
    function Botler(classifierFiles) {
        if (classifierFiles === void 0) { classifierFiles = exports.defaultClassifierDirectories; }
        this.debugOn = false;
        this.intents = [];
        this.platforms = [];
        this.scripts = {};
        this.onErrorScript = defaultErrorScript;
        var engine = new nlp_1.default(classifierFiles);
        this.intents = [engine];
        this.reducer = default_reducer_1.default.bind(this);
        this.setUserMiddlware(new memory_1.default(this));
        return this;
    }
    Botler.prototype.addIntent = function (newIntent) {
        this.intents = [].concat(this.intents, newIntent);
        return this;
    };
    Botler.prototype.unshiftIntent = function (newIntent) {
        this.intents = [].concat(newIntent, this.intents);
        return this;
    };
    Botler.prototype.newScript = function (name) {
        if (name === void 0) { name = DEFAULT_SCRIPT; }
        var newScript = new script_1.default(this, name);
        this.scripts[name] = newScript;
        return newScript;
    };
    Botler.prototype.getScript = function (name) {
        if (name === void 0) { name = DEFAULT_SCRIPT; }
        return this.scripts[name];
    };
    Botler.prototype.addGreeting = function (script) {
        this.greetingScript = script;
        return this;
    };
    Botler.prototype.setReducer = function (newReducer) {
        this.reducer = newReducer.bind(this);
        return this;
    };
    Botler.prototype.setUserMiddlware = function (middleware) {
        this.userMiddleware = middleware;
        return this;
    };
    Botler.prototype.addPlatform = function (platform) {
        this.platforms.push(platform);
        return this;
    };
    Botler.prototype.addErrorHandler = function (dialog) {
        this.onErrorScript = dialog;
        return this;
    };
    Botler.prototype.turnOnDebug = function () {
        this.debugOn = true;
        return this;
    };
    Botler.prototype.createEmptyIntent = function () {
        return {
            action: null,
            details: {
                confidence: 0,
            },
            topic: null,
        };
    };
    Botler.prototype.createEmptyUser = function (defaults) {
        if (defaults === void 0) { defaults = {}; }
        var anEmptyUser = {
            _platform: null,
            conversation: [],
            id: null,
            platform: null,
            script: null,
            scriptStage: 0,
            scriptArguments: null,
            state: null,
        };
        return _.defaults(defaults, anEmptyUser);
    };
    Botler.prototype.start = function () {
        this.platforms.forEach(function (platform) { return platform.start(); });
    };
    Botler.prototype.stop = function () {
        this.platforms.forEach(function (platform) { return platform.stop(); });
    };
    Botler.prototype.processGreeting = function (user) {
        var greetingMessage = {
            type: 'greeting',
        };
        return this.processMessage(user, greetingMessage);
    };
    Botler.prototype.processMessage = function (basicUser, message) {
        var _this = this;
        var user = null;
        var request = null;
        var response = null;
        return this.userMiddleware.getUser(basicUser)
            .catch(function (err) { return _.merge(_this.createEmptyUser(), basicUser); })
            .then(function (completeUser) {
            completeUser.conversation = completeUser.conversation.concat(message);
            user = completeUser;
            response = new outgoing_1.default(_this, user);
            return completeUser;
        })
            .then(function (completeUser) { return _this.getIntents(completeUser, message); })
            .then(function (intents) { return _this.reducer(intents, user); })
            .then(function (intent) {
            request = {
                intent: intent,
                message: message,
                user: user,
            };
            return _this._process(user, request, response);
        })
            .then(function () { return _this.userMiddleware.saveUser(user); })
            .then(function () { return; });
    };
    Botler.prototype.getIntents = function (user, message) {
        return Promise.map(this.intents, function (intent) { return intent.getIntents(message, user); })
            .then(_.flatten)
            .then(_.compact);
    };
    Botler.prototype._process = function (user, request, response) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            var blankScript = function () { return Promise.resolve(); };
            var nextScript = blankScript;
            if (_this.scripts[DEFAULT_SCRIPT]) {
                nextScript = function () {
                    return this.scripts[DEFAULT_SCRIPT].run(request, blankScript);
                }.bind(_this);
            }
            if (request.message.type === 'greeting' && user.script === null) {
                if (_this.greetingScript) {
                    return Promise.resolve()
                        .then(function () { return _this.greetingScript(user, response); })
                        .then(function () {
                        if (_this.scripts[DEFAULT_SCRIPT]) {
                            return _this.scripts[DEFAULT_SCRIPT].run(request, response, blankScript, -1);
                        }
                    });
                }
                else {
                    user.script = null;
                    user.scriptStage = -1;
                }
            }
            if (user.script != null && _this.scripts[user.script]) {
                return _this.scripts[user.script].run(request, response, nextScript);
            }
            else if (_this.scripts[DEFAULT_SCRIPT]) {
                return _this.scripts[DEFAULT_SCRIPT].run(request, response, blankScript, user.scriptStage);
            }
            else {
                throw new Error('No idea how to chain the scripts');
            }
        })
            .catch(function (err) {
            if (err instanceof script_1.EndScriptException) {
                if (user.script === null) {
                    return;
                }
                user.script = null;
                user.scriptStage = -1;
                user.scriptArguments = {};
                return _this._process(user, request, response);
            }
            else if (err instanceof script_1.StopException) {
                if (err.reason === script_1.StopScriptReasons.NewScript) {
                    return _this._process(user, request, response);
                }
                return;
            }
            else {
                console.error('error caught');
                console.error(err);
                return _this.onErrorScript(request, response, script_1.stopFunction);
            }
        });
    };
    return Botler;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Botler;
var defaultErrorScript = function (incoming, response, stop) {
    response.sendText('Uh oh, something went wrong, can you try again?');
    return Promise.resolve();
};
