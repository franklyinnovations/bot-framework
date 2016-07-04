'use strict';

const fs = require('fs');
const GenerateClassifier = require('../lib/classifier').GenerateClassifier;
const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const botler = require('../lib/index').default;
const baseBotTextNLP = require('../lib/index').baseBotTextNLP;
const Promise = require('bluebird');

describe('nlp', () => {
  const bot = new botler();
  bot.turnOnDebug();

  // it('built-in phrases', () => {
  //   const directories = [`${__dirname}/../nlp/phrases`];
  //   const phrases = {};
  //   directories.forEach(directory => fs.readdirSync(directory).forEach(file => {
  //     const key = /(.*).js/.exec(file);
  //     phrases[key[1]] = require(`${directory}/${file}`);
  //   }));
  //
  //   const keys = _.keys(phrases);
  //
  //   return Promise.map(keys, (theKey) => {
  //     return Promise.map(phrases[theKey], (phrase) => {
  //       const user = {
  //         state: 'none',
  //         intent: null,
  //       };
  //       return bot.processText(user, phrase)
  //         .then((user) => {
  //           if (user.intent.action !== theKey) {
  //             console.log(`--no--', ${theKey}, "${phrase}", ${user.intent.action}, ${user.intent.details.confidence*100}%`);
  //           }
  //           expect(user.intent.action).to.equal(theKey);
  //         });
  //     })
  //   });
  // });

  it('start', () => {
    const phrase = 'start';
    const expectedAction = 'startshopping';
    return baseBotTextNLP(phrase)
      .then((intent) => {
        if (intent.action !== expectedAction) {
          console.log(`--no--', ${expectedAction}, "${phrase}", ${intent.action}`);
        }
        expect(intent.action).to.equal(expectedAction);
      });
  });

  it('new search', () => {
    const phrase = 'new search';
    const expectedAction = 'new';
    return baseBotTextNLP(phrase)
      .then((intent) => {

        if (intent.action !== expectedAction) {
          console.log(`--no--', ${expectedAction}, "${phrase}", ${intent.action}`);
        }
        expect(intent.action).to.equal(expectedAction);
      });
  });

  it('What you suggest?', () => {
    const phrase = 'What you suggest?';
    const expectedAction = null;
    const user = {
      state: 'none',
      intent: null,
    };
    return bot.processText(user, phrase)
      .then((user) => {

        if (user.intent.action !== expectedAction) {
          console.log(`--no--', ${expectedAction}, "${phrase}", ${user.intent.action},  ${user.intent.details.confidence}%`);
        }
        expect(user.intent.action).to.equal(expectedAction);
      });
  });
});
