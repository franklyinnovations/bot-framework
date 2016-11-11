'use strict';

const fs = require('fs');
const GenerateClassifier = require('../lib/classifier').GenerateClassifier;
const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const botler = require('../lib/index').default;
const baseBotTextNLP = require('../lib/index').baseBotTextNLP;
const Promise = require('bluebird');
const onlyDirectories = require('../lib/classifier').onlyDirectories;

describe('nlp', () => {
  const bot = new botler();
  // bot.turnOnDebug();
  // console.log(bot.getTopics());

  const phrases = {};
  const prefix = `${__dirname}/../nlp/phrases`;
  const directories = [];
  fs.readdirSync(prefix).filter(onlyDirectories).forEach(dir => {
    directories.push(`${prefix}/${dir}`);
  })
  directories.forEach(directory => fs.readdirSync(directory).filter(file => !_.startsWith(file, '.')).forEach(file => {
    const key = /(.*).js/.exec(file);
    const phrase = key[1].replace(/-/g, ' ') 
    phrases[phrase] = require(`${directory}/${file}`);
  }));

  console.log(phrases);
  const keys = _.keys(phrases);

  _.forEach(keys, (theKey) => {
    _.forEach(phrases[theKey], (phrase) => {
      it (phrase, function() {
        return runTest(bot, this.test.title, theKey);
      });
    })
  });

  it('hi', function () {
    const phrase = this.test.title;
    const expectedAction = 'hello';
    return runTest(bot, phrase, expectedAction);
  });
});

function runTest(bot, phrase, expectedAction) {
  const user = bot.createEmptyUser();
  return bot.processText(user, phrase)
    .then((user) => {
      if (user.intent.action !== expectedAction) {
          throw new Error(`phrase: "${phrase}", expected: ${expectedAction}, actual: ${user.intent.action},  confidence: ${user.intent.details.confidence}%`);
      }
    });
}