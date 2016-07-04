#!/usr/bin/env node
"use strict";
var natural = require('natural');
var _ = require('lodash');
var fs = require('fs');
var classifier_1 = require('./classifier');
if (process.argv.length > 2) {
    var directories = process.argv.slice(2);
    var classifiers = classifier_1.GenerateClassifier([].concat(directories));
    var saveable = _.mapValues(classifiers, function (classifier) { return JSON.stringify(classifier); });
    fs.writeFile("classifiers.json", JSON.stringify(saveable), 'utf8');
}
else {
    console.error('Need directory to read phrases from');
}
