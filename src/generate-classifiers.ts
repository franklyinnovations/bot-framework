#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable max-len */

const natural = require('natural');
const _ = require('lodash');
const fs = require('fs');
import { GenerateClassifier } from './classifier';

if (process.argv.length > 2) {
  const directories = process.argv.slice(2);
  const classifiers = GenerateClassifier([].concat(directories));
  const saveable = _.mapValues(classifiers, classifier => JSON.stringify(classifier));
  fs.writeFile(`classifiers.json`, JSON.stringify(saveable), 'utf8');

} else {
  console.error('Need directory to read phrases from');
}
