"use strict";
const _ = require("lodash");
const Promise = require("bluebird");
const platform_1 = require("./types/platform");
exports.PlatformMiddleware = platform_1.PlatformMiddleware;
const outgoing_1 = require("./outgoing");
const Platforms = require("./platforms");
exports.Platforms = Platforms;
const memory_1 = require("./storage/memory");
const default_reducer_1 = require("./default-reducer");
const nlp_1 = require("./nlp");
exports.defaultClassifierDirectories = [`${__dirname}/../nlp/phrases`];
class Botler {
    constructor(classifierFiles = exports.defaultClassifierDirectories) {
        this.intents = [];
        this.debugOn = false;
        this.platforms = [];
        this.scripts = {};
        const engine = new nlp_1.default(classifierFiles);
        this.intents = [engine];
        this.reducer = default_reducer_1.default.bind(this);
        this.setUserMiddlware(new memory_1.default());
        return this;
    }
    addIntent(newIntent) {
        this.intents = [].concat(this.intents, newIntent);
        return this;
    }
    unshiftIntent(newIntent) {
        this.intents = [].concat(newIntent, this.intents);
        return this;
    }
    _addScript(topic, action, script) {
        console.log(this.scripts);
        if (_.has(this.scripts, [topic, action]) === false) {
            _.set(this.scripts, [topic, action], []);
        }
        this.scripts[topic][action].push(script);
        return this;
    }
    addScript() {
        if (arguments.length === 3) {
            return this._addScript(arguments[0], arguments[1], arguments[3]);
        }
        if (arguments.length === 2) {
            return this._addScript(arguments[0], '', arguments[1]);
        }
        if (arguments.length === 1) {
            return this._addScript('', '', arguments[0]);
        }
        throw new Error('Bad argument count');
    }
    addGreeting(script) {
        this.greetingScript = script;
        return this;
    }
    setReducer(newReducer) {
        this.reducer = newReducer.bind(this);
        return this;
    }
    setUserMiddlware(middleware) {
        this.userMiddleware = middleware;
        return this;
    }
    addPlatform(platform) {
        this.platforms.push(platform);
        return this;
    }
    turnOnDebug() {
        this.debugOn = true;
        return this;
    }
    getUser() {
        return this;
    }
    createEmptyIntent() {
        return {
            action: null,
            details: {
                confidence: 0,
            },
            topic: null,
        };
    }
    createEmptyUser(defaults = {}) {
        const anEmptyUser = {
            conversation: [],
            id: null,
            platform: null,
            state: null,
            _platform: null,
        };
        return _.defaults(defaults, anEmptyUser);
    }
    start() {
        this.platforms.forEach(platform => platform.start());
    }
    stop() {
        this.platforms.forEach(platform => platform.stop());
    }
    processGreeting(user) {
        if (this.greetingScript) {
            this.greetingScript(user, new outgoing_1.default(user));
        }
        return;
    }
    processMessage(user, message) {
        console.log(user);
        console.log(message);
        if (typeof user.conversation === 'undefined') {
            user.conversation = [];
        }
        user.conversation = user.conversation.concat(message);
        return this.getIntents(user, message)
            .then(intents => this.reducer(intents, user))
            .then(intent => {
            const topic = intent.topic;
            const action = intent.action;
            const request = {
                user: user,
                message: message,
                intent: intent,
            };
            console.log(request);
            let validScripts = [];
            if (_.has(this.scripts, [topic, action])) {
                validScripts = validScripts.concat(this.scripts[topic][action]);
            }
            if (_.has(this.scripts, [topic, ''])) {
                validScripts = validScripts.concat(this.scripts[topic]['']);
            }
            if (_.has(this.scripts, ['', ''])) {
                validScripts = validScripts.concat(this.scripts['']['']);
            }
            return this.callScript(request, validScripts);
        })
            .catch((err) => {
            console.error('error caught');
            console.error(err);
        });
    }
    getIntents(user, message) {
        return Promise.map(this.intents, intent => intent.getIntents(message, user))
            .then(_.flatten)
            .then(_.compact);
    }
    callScript(request, scripts) {
        if (scripts.length > 0) {
            return Promise.resolve();
        }
        const response = new outgoing_1.default(request.user);
        const currentScript = _.head(scripts);
        const nextScripts = _.tail(scripts);
        const nextFunction = this.callScript.bind(this, request, nextScripts);
        return Promise.resolve(currentScript(request, response, nextFunction));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Botler;
