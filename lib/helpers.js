"use strict";
const _ = require('lodash');
const natural = require('natural');
const NGrams = natural.NGrams;
const tokenizer = new natural.WordTokenizer();
const Promise = require('bluebird');
const fs = require('fs');
const classifier_1 = require('./classifier');
const locations = loadLocations(`${__dirname}/../nlp/locations`);
const dateClassifiers = classifier_1.GenerateClassifier([`${__dirname}/../nlp/dates`]);
function grabTopics(text) {
    const datesCompacted = classifier_1.runThroughClassifiers(text, dateClassifiers);
    const datesGrouped = _.groupBy(datesCompacted, 'topic');
    const specials = _.compact(tokenizer.tokenize(text).filter(token => !isNaN(parseInt(token, 10))));
    const intent = {
        action: null,
        details: {
            dates: _.mapValues(datesGrouped, (classifications) => classifications.map(classification => _.startCase(classification.label))),
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
    const readLocations = {};
    fs.readdirSync(theDirectory)
        .filter((aDirectory) => onlyDirectories(aDirectory))
        .forEach(topic => {
        console.log('topic:', topic);
        readLocations[topic] = {};
        fs.readdirSync(`${theDirectory}/${topic}`)
            .filter(file => !_.startsWith(file, '.'))
            .forEach(file => {
            const key = /(.*).json/.exec(file)[1].replace(/-/g, ' ');
            const phrases = require(`${theDirectory}/${topic}/${file}`);
            readLocations[topic][key] = phrases;
        });
    });
    // console.log(readLocations);
    return readLocations;
}
function createTokens(text) {
    const tokenized = tokenizer.tokenize(text);
    const biGrams = NGrams.ngrams(tokenized, 2).map((words) => words.join(' '));
    const triGrams = NGrams.ngrams(tokenized, 3).map((words) => words.join(' '));
    const ngrams = _.flatten(tokenized.concat(biGrams, triGrams));
    const allPhrases = ngrams.map(phrase => phrase.toLowerCase());
    return allPhrases;
}
function locatonExtractor(text) {
    const allPhrases = createTokens(text);
    // console.log('allPhrases', allPhrases);
    const matchingCities = _.mapValues(locations, topic => _.pickBy(topic, (value, key) => {
        const theseCities = value.map(location => location.toLowerCase());
        // console.log(theseCities);
        return _.intersection(allPhrases, theseCities).length > 0;
    }));
    // console.log('matchingCities', matchingCities);
    const pickedTopics = _.pickBy(matchingCities, topic => _.keys(topic).length > 0);
    const mapped = _.mapValues(pickedTopics, topic => _.keys(topic));
    // console.log(matchingCities);
    return mapped;
}
exports.locatonExtractor = locatonExtractor;
function getLocationConfidence(text, searchLocation) {
    let matchingCities = _.map(locations, (subLocations, key) => {
        // console.log(subLocations);
        return _.map(subLocations, (cities) => {
            // console.log(cities, searchLocation);
            const normalizedCities = cities.map(city => city.toLowerCase());
            return _.includes(normalizedCities, searchLocation.toLowerCase()) ? normalizedCities : null;
        });
    });
    const cityList = _.compact(_.flattenDeep(matchingCities));
    const allPhrases = createTokens(text);
    const matchingPhrase = _.intersection(allPhrases, cityList);
    const textTokenized = tokenizer.tokenize(text);
    const locationTokenized = tokenizer.tokenize(matchingPhrase[0]);
    return locationTokenized.length / textTokenized.length;
}
exports.getLocationConfidence = getLocationConfidence;
