"use strict";
var _ = require('lodash');
var fs = require('fs');
var Promise = require('bluebird');
var util = require('util');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();
var helpers_1 = require('./helpers');
var saved = JSON.parse(fs.readFileSync(__dirname + "/../nlp/classifiers.json", 'utf8'));
var classifiers = _.mapValues(saved, function (archived) {
    return natural.BayesClassifier.restore(JSON.parse(archived));
});
var ChatBot = (function () {
    function ChatBot(classifierFiles) {
        if (classifierFiles === void 0) { classifierFiles = []; }
        classifierFiles.forEach(function (filename) {
            var unpacked = JSON.parse(fs.readFileSync(filename, 'utf8'));
            var newClassifiers = _.mapValues(unpacked, function (archived) {
                return natural.BayesClassifier.restore(JSON.parse(archived));
            });
            classifiers = _.defaults(classifiers, newClassifiers);
        });
        this.intents = [baseBotTextNLP, helpers_1.grabTopics];
        this.skills = [];
        this.reducer = defaultReducer;
        this.debugOn = false;
    }
    ChatBot.prototype.unshiftIntent = function (newIntent) {
        this.intents = [].concat(newIntent, this.intents);
    };
    ChatBot.prototype.unshiftSkill = function (newSkill) {
        this.skills = [].concat(newSkill, this.skills);
    };
    ChatBot.prototype.setReducer = function (newReducer) {
        this.reducer = newReducer;
    };
    ChatBot.prototype.turnOnDebug = function () {
        this.debugOn = true;
    };
    ChatBot.prototype.processText = function (user, text) {
        var _this = this;
        if (typeof user.conversation === 'undefined') {
            user.conversation = [];
        }
        user.conversation = user.conversation.concat(text);
        return Promise.map(this.intents, function (intent) { return intent(text, user); })
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
function baseBotTextNLP(text) {
    var filtered = _.map(classifiers, function (classifier, key) {
        var result = classifier.getClassifications(text)[0];
        if (result.label === 'false') {
            return null;
        }
        return {
            label: key,
            value: result.value,
        };
    });
    var compacted = _.compact(filtered);
    if (compacted.length === 0) {
        return null;
    }
    var sorted = _.orderBy(compacted, ['value'], 'desc');
    var intent = {
        action: sorted[0].label,
        details: {},
    };
    return Promise.resolve(intent);
}
exports.baseBotTextNLP = baseBotTextNLP;
function defaultReducer(intents) {
    var _this = this;
    return Promise.resolve(_.compact(intents))
        .then(function (validIntents) {
        if (_this.debugOn)
            console.log('validIntents', util.inspect(validIntents, { depth: null }));
        if (validIntents.length === 0) {
            var unknownIntent = { action: 'none' };
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
