"use strict";
const classifier_1 = require("./classifier");
const helpers_1 = require("./helpers");
const _ = require("lodash");
const util = require("util");
exports.defaultClassifierDirectories = [`${__dirname}/../nlp/phrases`];
class NLPBase {
    constructor(classifierFiles = exports.defaultClassifierDirectories) {
        const allClassifiers = classifier_1.GenerateClassifier(classifierFiles, `${__dirname}/../nlp/classifiers.json`);
        this.classifiers = allClassifiers;
        this.components = [
            baseBotTextNLP.bind(this),
            locationNLP.bind(this),
            helpers_1.grabTopics.bind(this)
        ];
        return this;
    }
    getIntents(message) {
        if (message.type === 'text') {
            const promises = this.components.map(func => func(message.text));
            return Promise.all(promises)
                .then(intents => {
                const flat = _.flatten(intents);
                return flat;
            });
        }
        else {
            return Promise.resolve([]);
        }
    }
    retrainClassifiers(classifierFiles = exports.defaultClassifierDirectories) {
        const allClassifiers = classifier_1.GenerateClassifier(classifierFiles);
        this.classifiers = allClassifiers;
    }
    getTopics() {
        const topics = _.mapValues(this.classifiers, (value, key) => _.keys(value).map(key => key.replace(/-/g, ' ')));
        return topics;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NLPBase;
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
