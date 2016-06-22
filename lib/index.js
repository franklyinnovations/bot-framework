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
    function ChatBot() {
        this.intents = [baseBotTextNLP, helpers_1.grabTopics];
        this.skills = [];
        this.reducer = defaultReducer;
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
    ChatBot.prototype.processResponse = function (user, text) {
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
    console.log(sorted);
    var intent = {
        request: sorted[0].label,
        details: {},
    };
    return Promise.resolve(intent);
}
exports.baseBotTextNLP = baseBotTextNLP;
function defaultReducer(intents) {
    return Promise.resolve(_.compact(intents))
        .then(function (validIntents) {
        console.log(util.inspect(validIntents, { depth: null }));
        if (validIntents.length === 0) {
            return { request: 'none' };
        }
        var mergedDetails = _.defaults({}, validIntents.map(function (intent) { return intent.details; }));
        var firstIntent = validIntents[0];
        firstIntent.details = mergedDetails;
        console.log(firstIntent);
        return firstIntent;
    });
}
exports.defaultReducer = defaultReducer;
