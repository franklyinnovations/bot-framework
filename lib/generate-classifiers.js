#!/usr/bin/env node
"use strict";
var natural = require('natural');
var _ = require('lodash');
var fs = require('fs');
function GenerateClassifier(directories) {
    var phrases = {};
    directories.forEach(function (directory) { return fs.readdirSync(directory).forEach(function (file) {
        var key = /(.*).js/.exec(file);
        console.log("loading '" + key[1] + "'");
        phrases[key[1]] = require(process.cwd() + "/" + directory + "/" + file);
    }); });
    var allPhrases = _.flatten(_.values(phrases));
    var classifiers = _.mapValues(phrases, function (value, key) {
        var classifier = new natural.BayesClassifier();
        var otherPhrases = _.difference(allPhrases, value);
        value.forEach(function (phrase) { return classifier.addDocument(phrase, 'true'); });
        otherPhrases.forEach(function (phrase) { return classifier.addDocument(phrase, 'false'); });
        classifier.train();
        return classifier;
    });
    var saveable = _.mapValues(classifiers, function (classifier) { return JSON.stringify(classifier); });
    fs.writeFile("classifiers.json", JSON.stringify(saveable), 'utf8');
}
exports.GenerateClassifier = GenerateClassifier;
if (process.argv.length > 2) {
    var directories = process.argv.slice(2);
    GenerateClassifier([].concat(directories));
}
else {
    console.error('Need directory to read phrases from');
}
