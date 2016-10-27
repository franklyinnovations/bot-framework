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
  bot.turnOnDebug();
  // console.log(bot.getTopics());

  it('built-in phrases', () => {
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
  
    const keys = _.keys(phrases);
  
    return Promise.map(keys, (theKey) => {
      return Promise.map(phrases[theKey], (phrase) => {
        const user = bot.createEmptyUser();
        return bot.processText(user, phrase)
          .then((user) => {
            if (user.intent.action !== theKey) {
              console.log(`-- incorrect --', ${theKey}, "${phrase}", ${user.intent.action}, ${user.intent.details.confidence*100}%`);
            }
            expect(user.intent.action).to.equal(theKey);
          });
      })
    });
  });

  it('start shopping', function () {
    const phrase = this.test.title;
    const expectedAction = 'startshopping';
    const user = bot.createEmptyUser();
    return bot.processText(user, phrase)
      .then((user) => {
        if (user.intent.action !== expectedAction) {
          console.log(`--no--', ${expectedAction}, "${phrase}", ${user.intent.action},  ${user.intent.details.confidence}%`);
        }
        expect(user.intent.action).to.equal(expectedAction);
      });
  });

  it('new search', function () {
    const phrase = this.test.title;
    const expectedAction = 'new';
    const user = bot.createEmptyUser();
    return bot.processText(user, phrase)
      .then((user) => {
        if (user.intent.action !== expectedAction) {
          console.log(`--no--', ${expectedAction}, "${phrase}", ${user.intent.action},  ${user.intent.details.confidence}%`);
        }
        expect(user.intent.action).to.equal(expectedAction);
      });
  });

  it('What you suggest?', function () {
    const phrase = this.test.title;
    const expectedAction = null;
    const user = bot.createEmptyUser();
    return bot.processText(user, phrase)
      .then((user) => {
        if (user.intent.action !== expectedAction) {
          console.log(`--no--', ${expectedAction}, "${phrase}", ${user.intent.action},  ${user.intent.details.confidence}%`);
        }
        expect(user.intent.action).to.equal(expectedAction);
      });
  });

  it.only('are you in', function () {
    const phrase = this.test.title;
    const expectedAction = 'location';
    const user = bot.createEmptyUser();
    return bot.processText(user, phrase)
      .then((user) => {
        if (user.intent.action !== expectedAction) {
          console.log(`--no--', ${expectedAction}, "${phrase}", ${user.intent.action},  ${user.intent.details.confidence}%`);
        }
        expect(user.intent.action).to.equal(expectedAction);
      });
  });
});
