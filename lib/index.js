"use strict";
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();
var classifier_1 = require('./classifier');
var helpers_1 = require('./helpers');
var defaultClassifierDirectories = [(__dirname + "/../nlp/phrases")];
var ChatBot = (function () {
    function ChatBot(classifierFiles) {
        if (classifierFiles === void 0) { classifierFiles = []; }
        var allClassifiers = classifier_1.GenerateClassifier(classifierFiles.concat(defaultClassifierDirectories));
        this.classifiers = allClassifiers;
        // console.log(_.keys(this.classifiers));
        this.intents = [baseBotTextNLP.bind(this), locationNLP.bind(this), helpers_1.grabTopics.bind(this)];
        this.skills = [];
        this.reducer = defaultReducer.bind(this);
        this.debugOn = false;
        return this;
    }
    ChatBot.prototype.unshiftIntent = function (newIntent) {
        this.intents = [].concat(newIntent.bind(this), this.intents);
        return this;
    };
    ChatBot.prototype.unshiftSkill = function (newSkill) {
        this.skills = [].concat(newSkill.bind(this), this.skills);
        return this;
    };
    ChatBot.prototype.setReducer = function (newReducer) {
        this.reducer = newReducer.bind(this);
        return this;
    };
    ChatBot.prototype.turnOnDebug = function () {
        this.debugOn = true;
        return this;
    };
    ChatBot.prototype.retrainClassifiers = function (classifierFiles) {
        if (classifierFiles === void 0) { classifierFiles = []; }
        var allClassifiers = classifier_1.GenerateClassifier(classifierFiles.concat(defaultClassifierDirectories));
        this.classifiers = allClassifiers;
    };
    ChatBot.prototype.createEmptyIntent = function () {
        return {
            action: null,
            details: {
                confidence: 0,
            },
            topic: null,
        };
    };
    ChatBot.prototype.createEmptyUser = function (defaults) {
        if (defaults === void 0) { defaults = {}; }
        var anEmptyUser = {
            conversation: [],
            intent: this.createEmptyIntent(),
            state: 'none',
        };
        return _.defaults(anEmptyUser, defaults);
    };
    ChatBot.prototype.processText = function (user, text) {
        var _this = this;
        if (typeof user.conversation === 'undefined') {
            user.conversation = [];
        }
        user.conversation = user.conversation.concat(text);
        return Promise.map(this.intents, function (intent) { return intent(text, user); })
            .then(_.flatten)
            .then(_.compact)
            .then(function (intents) { return _this.reducer(intents, user); })
            .then(function (intent) {
            user.intent = intent;
            for (var i = 0; i < _this.skills.length; i++) {
                var result = _this.skills[i](user);
                if (result !== null) {
                    return result;
                }
            }
            return null;
        })
            .then(function () { return Promise.resolve(user); });
    };
    return ChatBot;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChatBot;
function baseBotTextNLP(text) {
    var compacted = classifier_1.runThroughClassifiers(text, this.classifiers);
    if (compacted.length === 0) {
        return null;
    }
    var sorted = _.orderBy(compacted, ['value'], 'desc');
    if (this && this.debugOn) {
        console.log(text + "\n" + util.inspect(sorted, { depth: null }));
    }
    ;
    var intents = sorted.map(function (intent) {
        var baseIntent = {
            action: intent.label,
            details: {
                confidence: intent.value,
            },
            topic: intent.topic,
        };
        return baseIntent;
    });
    return Promise.resolve(intents);
}
exports.baseBotTextNLP = baseBotTextNLP;
function locationNLP(text) {
    var locations = helpers_1.locatonExtractor(text);
    if (_.keys(locations).length === 0) {
        return Promise.resolve([]);
    }
    var action = _.keys(locations)[0];
    var city = locations[action][0];
    var intent = {
        topic: 'locations',
        action: action,
        details: {
            confidence: helpers_1.getLocationConfidence(text, city),
        },
    };
    return Promise.resolve([intent]);
}
exports.locationNLP = locationNLP;
function defaultReducer(intents) {
    var _this = this;
    return Promise.resolve(_.compact(intents))
        .then(function (validIntents) { return _.orderBy(validIntents, function (intent) { return intent.details.confidence || 0; }, 'desc'); })
        .then(function (validIntents) {
        if (_this.debugOn) {
            console.log('validIntents', util.inspect(validIntents, { depth: null }));
        }
        ;
        if (validIntents.length === 0) {
            var unknownIntent = {
                action: 'none',
                details: {
                    confidence: 0,
                },
                topic: null,
            };
            return unknownIntent;
        }
        var mergedDetails = _.defaults.apply(_this, validIntents.map(function (intent) { return intent.details; }));
        var firstIntent = validIntents[0];
        firstIntent.details = mergedDetails;
        if (_this.debugOn) {
            console.log(firstIntent);
        }
        ;
        return firstIntent;
    });
}
exports.defaultReducer = defaultReducer;
