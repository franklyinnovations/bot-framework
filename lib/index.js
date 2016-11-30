"use strict";
const _ = require('lodash');
const Promise = require('bluebird');
const util = require('util');
const classifier_1 = require('./classifier');
const helpers_1 = require('./helpers');
// export type Session = 
exports.defaultClassifierDirectories = [`${__dirname}/../nlp/phrases`];
class ChatBot {
    constructor(classifierFiles = exports.defaultClassifierDirectories) {
        const allClassifiers = classifier_1.GenerateClassifier(classifierFiles, `${__dirname}/../nlp/classifiers.json`);
        this.classifiers = allClassifiers;
        // console.log(_.keys(this.classifiers));
        this.intents = [baseBotTextNLP.bind(this), locationNLP.bind(this), helpers_1.grabTopics.bind(this)];
        this.skills = [];
        this.reducer = defaultReducer.bind(this);
        this.debugOn = false;
        return this;
    }
    addIntent(newIntent) {
        this.intents = [].concat(this.intents, newIntent.bind(this));
        return this;
    }
    unshiftIntent(newIntent) {
        this.intents = [].concat(newIntent.bind(this), this.intents);
        return this;
    }
    addSkill(newSkill) {
        this.skills = [].concat(this.skills, newSkill.bind(this));
        return this;
    }
    unshiftSkill(newSkill) {
        this.skills = [].concat(newSkill.bind(this), this.skills);
        return this;
    }
    setReducer(newReducer) {
        this.reducer = newReducer.bind(this);
        return this;
    }
    turnOnDebug() {
        this.debugOn = true;
        return this;
    }
    getUser() {
        return this;
    }
    retrainClassifiers(classifierFiles = exports.defaultClassifierDirectories) {
        const allClassifiers = classifier_1.GenerateClassifier(classifierFiles);
        this.classifiers = allClassifiers;
    }
    getTopics() {
        const topics = _.mapValues(this.classifiers, (value, key) => _.keys(value).map(key => key.replace(/-/g, ' ')));
        return topics;
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
            id: null,
            platform: null,
            conversation: [],
            intent: this.createEmptyIntent(),
            state: 'none',
        };
        return _.defaults(anEmptyUser, defaults);
    }
    processText(user, text) {
        if (typeof user.conversation === 'undefined') {
            user.conversation = [];
        }
        user.conversation = user.conversation.concat(text);
        return Promise.map(this.intents, intent => intent(text, user))
            .then(_.flatten)
            .then(_.compact)
            .then((intents) => this.reducer(intents, user))
            .then(intent => {
            user.intent = intent;
            for (let i = 0; i < this.skills.length; i++) {
                const result = this.skills[i](user);
                if (result !== null) {
                    return result;
                }
            }
            return null;
        })
            .then(() => Promise.resolve(user));
    }
    addPlatform() {
        return thus;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChatBot;
function baseBotTextNLP(text) {
    const compacted = classifier_1.runThroughClassifiers(text, this.classifiers);
    if (compacted.length === 0) {
        return null;
    }
    const sorted = _.orderBy(compacted, ['value'], 'desc');
    if (this && this.debugOn) {
        console.log(`${text}\n${util.inspect(sorted, { depth: null })}`);
    }
    ;
    const intents = sorted.map(intent => {
        const baseIntent = {
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
    const locations = helpers_1.locatonExtractor(text);
    if (_.keys(locations).length === 0) {
        return Promise.resolve([]);
    }
    const action = _.keys(locations)[0];
    const city = locations[action][0];
    const intent = {
        action: action,
        details: {
            confidence: helpers_1.getLocationConfidence(text, city),
        },
        topic: 'locations',
    };
    return Promise.resolve([intent]);
}
exports.locationNLP = locationNLP;
function defaultReducer(intents) {
    return Promise.resolve(_.compact(intents))
        .then((validIntents) => _.orderBy(validIntents, (intent) => intent.details.confidence || 0, 'desc'))
        .then((validIntents) => {
        if (this.debugOn) {
            console.log('validIntents', util.inspect(validIntents, { depth: null }));
        }
        ;
        if (validIntents.length === 0) {
            const unknownIntent = {
                action: 'none',
                details: {
                    confidence: 0,
                },
                topic: null,
            };
            return unknownIntent;
        }
        const mergedDetails = _.defaults.apply(this, validIntents.map(intent => intent.details));
        const firstIntent = validIntents[0];
        firstIntent.details = mergedDetails;
        if (this.debugOn) {
            console.log(firstIntent);
        }
        ;
        return firstIntent;
    });
}
exports.defaultReducer = defaultReducer;
