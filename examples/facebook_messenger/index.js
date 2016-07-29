"use strict"
const botler = require('botler').default;
const sendApi = require('facebook-send-api').default;
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const util = require('util');

const token = process.env.TOKEN || 'xxx';
const verify_token = process.env.VERIFYTOKEN || 'yyy';
const webhookPath = process.env.WEBHOOKPATH || '/webook';

const bot = new botler();
const fb = new sendApi(token);
const app = express();

const userDB = {};

// chatbot setup
bot.unshiftSkill(confusedSkill);
bot.unshiftSkill(SpeechSkill);

function confusedSkill(user) {
  user.state = 'unknown';
  return FBPlatform.sendTextMessage(user.id, 'you confuse me')
    .then(() => sender);
}

function SpeechSkill(user) {
  const intent = sender.intent.action;

  switch (intent) {
    case 'hello':
      user.state = 'chat';
      return fb.sendTextMessage(user.id, 'hey')
        .then(() => sendStyles(sender));

    case 'help':
      user.state = 'help';
      return fb.sendTextMessage(user.id, 'Even I don\'t know what I can do')
        .then(() => sender);

    case 'yes':
      switch(user.state) {
        case 'reset':
          return fb.sendTextMessage(user.id, 'I have already forgotten you')
            .then(() => sender);
        default:
          return null;
      }

    case 'no':
      switch(user.state) {
        case 'reset':
          return fb.sendTextMessage(user.id, 'nevermind then')
            .then(() => sender);
        default:
          return null;
      }

    case 'reset':
      sender.state = 'reset';
      return fb.sendTextMessage(user.id, 'Do you want to reset? (yes or no)')
        .then(() => sender);

    default:
      return null;
  }

  return null;
}

function getUser(userID) {
  if (userDB[userID]) {
    return Promise.resolve(userDB[userID])
  }
  return Promise.resolve(bot.createEmptyUser({ id: userID })); //we should save the user...
}

function saveUser(user) {
  userDB[user.id] = userDB[userID];
  return Promise.resolve(user);
}

// Facebook webhook setup
app.use(bodyParser.json());
app.get(webhookPath, (req, res) => {
  if (req.query['hub.verify_token'] === verify_token) {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
});

app.post(webhookPath, (req, res) => {
  const messagingEvents = _.flatten(req.body.entry.map(entry => entry.messaging));
  for (let i = 0; i < messagingEvents.length; i++) {
    const event = messagingEvents[i];
    console.log('event', util.inspect(event, { showHidden: true, depth: null, colors: true }));

    const sender = event.sender;
    let promise = getUser(event.sender.id)
      .then((aUser) => {
        FBPlatform.sendReadReceipt(sender.id);
        return aUser
      });

    if (event.message && event.message.text) {
      // something was written by the user
      promise = promise.then((aUser) => bot.processText(aUser, event.message.text));
    }

    if (event.postback) {
      // a button has been clicked
    }

    promise = promise.then((aUser) => saveUser(aUser));

    res.sendStatus(200);
  }
});

app.set('port', process.env.PORT || 3002);
app.listen(app.get('port'), () => {
  console.log('Messanger webhook running on port ' + app.get('port') + ' at ' + webhookPath);
});
