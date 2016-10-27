"use strict";
var _ = require('lodash');
var natural = require('natural');
var NGrams = natural.NGrams;
var tokenizer = new natural.WordTokenizer();
var Promise = require('bluebird');
var fs = require('fs');
var classifier_1 = require('./classifier');
var locations = loadLocations(__dirname + "/../nlp/locations");
var dateClassifiers = classifier_1.GenerateClassifier([(__dirname + "/../nlp/dates")]);
function grabTopics(text) {
    var datesCompacted = classifier_1.runThroughClassifiers(text, dateClassifiers);
    var datesGrouped = _.groupBy(datesCompacted, 'topic');
    var specials = _.compact(tokenizer.tokenize(text).filter(function (token) { return !isNaN(parseInt(token, 10)); }));
    var intent = {
        action: null,
        details: {
            dates: _.mapValues(datesGrouped, function (classifications) { return classifications.map(function (classification) { return _.startCase(classification.label); }); }),
            specialWords: specials,
            locations: locatonExtractor(text),
        },
        topic: 'details',
    };
    // if (this && this.debugOn) { console.log('details intent', util.inspect(intent, { depth: null })); };
    return Promise.resolve(intent);
}
exports.grabTopics = grabTopics;
function onlyDirectories(name) {
    return !(_.startsWith(name, '.') || _.endsWith(name, '.json'));
}
function loadLocations(theDirectory) {
    var readLocations = {};
    fs.readdirSync(theDirectory)
        .filter(function (aDirectory) { return onlyDirectories(aDirectory); })
        .forEach(function (topic) {
        console.log('topic:', topic);
        readLocations[topic] = {};
        fs.readdirSync(theDirectory + "/" + topic)
            .filter(function (file) { return !_.startsWith(file, '.'); })
            .forEach(function (file) {
            var key = /(.*).json/.exec(file)[1].replace(/-/g, ' ');
            var phrases = require(theDirectory + "/" + topic + "/" + file);
            readLocations[topic][key] = phrases;
        });
    });
    // console.log(readLocations);
    return readLocations;
}
function createTokens(text) {
    var tokenized = tokenizer.tokenize(text);
    var biGrams = NGrams.ngrams(tokenized, 2).map(function (words) { return words.join(' '); });
    var triGrams = NGrams.ngrams(tokenized, 3).map(function (words) { return words.join(' '); });
    var ngrams = _.flatten(tokenized.concat(biGrams, triGrams));
    var allPhrases = ngrams.map(function (phrase) { return phrase.toLowerCase(); });
    return allPhrases;
}
function locatonExtractor(text) {
    var allPhrases = createTokens(text);
    // console.log('allPhrases', allPhrases);
    var matchingCities = _.mapValues(locations, function (topic) {
        return _.pickBy(topic, function (value, key) {
            var theseCities = value.map(function (location) { return location.toLowerCase(); });
            // console.log(theseCities);
            return _.intersection(allPhrases, theseCities).length > 0;
        });
    });
    // console.log('matchingCities', matchingCities);
    var pickedTopics = _.pickBy(matchingCities, function (topic) { return _.keys(topic).length > 0; });
    var mapped = _.mapValues(pickedTopics, function (topic) { return _.keys(topic); });
    // console.log(matchingCities);
    return mapped;
}
exports.locatonExtractor = locatonExtractor;
function getLocationConfidence(text, searchLocation) {
    var matchingCities = _.map(locations, function (subLocations, key) {
        // console.log(subLocations);
        return _.map(subLocations, function (cities) {
            // console.log(cities, searchLocation);
            var normalizedCities = cities.map(function (city) { return city.toLowerCase(); });
            return _.includes(normalizedCities, searchLocation.toLowerCase()) ? normalizedCities : null;
        });
    });
    var cityList = _.compact(_.flattenDeep(matchingCities));
    var allPhrases = createTokens(text);
    var matchingPhrase = _.intersection(allPhrases, cityList);
    var textTokenized = tokenizer.tokenize(text);
    var locationTokenized = tokenizer.tokenize(matchingPhrase[0]);
    return locationTokenized.length / textTokenized.length;
}
exports.getLocationConfidence = getLocationConfidence;
