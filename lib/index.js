"use strict";
var _ = require('lodash');
var fs = require('fs');
var Promise = require('bluebird');
var util = require('util');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();
var classifier_1 = require('./classifier');
var helpers_1 = require('./helpers');
var ChatBot = (function () {
    function ChatBot(classifierFiles) {
        if (classifierFiles === void 0) { classifierFiles = []; }
        var allClassifiers = classifier_1.GenerateClassifier(classifierFiles.concat(__dirname + "/../nlp/phrases"));
        this.classifiers = allClassifiers;
        // console.log(_.keys(this.classifiers));
        this.intents = [baseBotTextNLP.bind(this), helpers_1.grabTopics.bind(this)];
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
        var allClassifiers = classifier_1.GenerateClassifier(classifierFiles.concat([(__dirname + "/../nlp/phrases")]));
        this.classifiers = allClassifiers;
    };
    ChatBot.prototype.createEmptyIntent = function () {
        return {
            action: null,
            topic: null,
            details: {},
        };
    };
    ChatBot.prototype.createEmptyUser = function (defaults) {
        if (defaults === void 0) { defaults = {}; }
        return _.defaults({
            conversation: [],
            state: 'none',
            intent: this.createEmptyIntent(),
        }, defaults);
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
            .then(this.reducer)
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
function checkUsingClassifier(text, classifier, label, topic) {
    var result = classifier.getClassifications(text)[0];
    if (result.label === 'false') {
        return null;
    }
    return {
        label: label,
        topic: topic,
        value: result.value,
    };
}
function baseBotTextNLP(text) {
    var filtered = _.map(this.classifiers, function (classifiers, topic) {
        var trueClassifications = _.map(classifiers, function (classifier, label) { return checkUsingClassifier(text, classifier, label, topic); });
        // console.log(topic, trueClassifications);
        return _.compact(trueClassifications);
    });
    var compacted = _.compact(_.flatten(filtered));
    if (this && this.debugOn)
        console.log('compacted', util.inspect(compacted, { depth: null }));
    if (classifier_1.classifier === natural.LogisticRegressionClassifier) {
        compacted = compacted.filter(function (result) { return result.value > 0.6; });
    }
    if (compacted.length === 0) {
        return null;
    }
    var sorted = _.orderBy(compacted, ['value'], 'desc');
    if (this && this.debugOn)
        console.log(text + "\n" + util.inspect(sorted, { depth: null }));
    var intents = sorted.map(function (intent) { return ({
        action: intent.label,
        topic: intent.topic,
        details: {
            confidence: intent.value,
        },
    }); });
    return Promise.resolve(intents);
}
exports.baseBotTextNLP = baseBotTextNLP;
function defaultReducer(intents) {
    var _this = this;
    return Promise.resolve(_.compact(intents))
        .then(function (validIntents) {
        if (_this.debugOn)
            console.log('validIntents', util.inspect(validIntents, { depth: null }));
        if (validIntents.length === 0) {
            var unknownIntent = { action: 'none', topic: null };
            return unknownIntent;
        }
        var mergedDetails = _.defaults.apply(_this, validIntents.map(function (intent) { return intent.details; }));
        var firstIntent = validIntents[0];
        firstIntent.details = mergedDetails;
        if (_this.debugOn)
            console.log(firstIntent);
        return firstIntent;
    });
}
exports.defaultReducer = defaultReducer;
