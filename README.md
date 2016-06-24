# Botler - Build contextual chat bots

Botler was developed to let [fynd](https://fynd.me) build a contextual-aware chatbot to be everyone's favorite personal shopper. We found that many chatbots and pre-exisiting chatbot frameworks were fine at simple action => response behavior, but weren't great at using contextual clues to prove a more fluid experience.

A second goal of Botler was to provide as much general out-of-the-box language functionality as possible. We shouldn't keep reiventing the NLP wheel.

## Components
Botler uses three components to build a bot, **intents**, **actions** and the **reducer**.
* **Intents** take a text input (and potential the conversation so far) and return the intent of the user, for example "tell me weather in London" maps to {action:'weather', details:{ location: 'London' } }
* **Skills** take intents and the state of the conversation to run an action such as querying an API and sending the results to the user
* The **Reducer** takes multiple intents and reduces it to the correct one
* The **User** is a simple object the holds the current state, detected intent, and conversation (if intents require rocessing of the entire conversation). It is easily entended by adding more keys to hold application specific info (such as a unique user id).

## Built-in functionality
Botler comes with a few key intents already installed. Some are
* help for example if the user types "help", "instruction", etc
* yes
* no
* hello
* *many more...*

## Installation
```bash
$ npm install --save botler
```
## User object

## Intents
An intent is something the user wants done.

A function that takes the currently input text and the user object and returns an intent through a promise. The intent was chosen to be promise based in case it needs to make a call to another process or web api. For example, fyndbot queries the fynd suggestion api to detect if any fashion dna was entered by the user.

## Reducer
Pick the right intent to pass on.

The reducer takes all array of results and returns a single intent. The default reducer takes the first intent that returns a valid action and then merges all the intents' details, this allowes intents to become small modules. For example, out of the box, a 'topic intent' is always run that tries to extract people and places from the text stream.


## Skills
A skill is something the bot knows how to do.

A function that takes a user object and returns a promise. Skills most likely will read in the intent and state of the user and decide to run an action, an api call for example.


## Adding new phrases
Just make a directory of Javascript files that each are named for the intent and export an array of strings representing that phrase and run the baysian classifier engine locally.
```javascript
/// nlp/phrases/weather.js
module.exports = [ 'what\'s the weather in', 'weather', 'tell me the forecast'];
```
```bash
$ generate-classifiers ./nlp/phrases/ ./node_modules/botler/nlp/phrases
```

## Weather Bot Example
A weather chatbot in less than 100 lines!

### Import
```typescript
const Botler = require('botler');
import { User, Intent } from 'botler';
```

### Adding weather based phrase detection
```bash
$ generate-classifiers ./nlp/phrases ./node_modules/botler/nlp/phrases
```
```typescript
//teach bot about weather
const bot = new Botler(['./nlp/classifiers.json']);

function weatherSkill(user: User): Promise<User> {
  if (user.state === 'city'
  && user.intent.details.places && user.intent.details.places.length > 0) {
    console.log(`the weather in ${user.intent.details.places[0].title} will be sunny`);
    user.state = 'none';
    return Promise.resolve(user);
  }

  if (user.intent.action === 'weather') {
    if (!user.intent.details.places || user.intent.details.places.length === 0) {
      console.log('What city would you like the weather for?')
      user.state = 'city';
      return Promise.resolve(user);
    } else {
      // return weatherapi(...).then(()=>user);
      console.log(`the weather in ${user.intent.details.places[0].title} will be sunny`);
      user.state = 'none';
      return Promise.resolve(user);
    }
  }
  return null;  //return null if skill can't process intent;
}
```

### Adding new actions for basic built-in bot functionarly
```typescript
function confusedSkill(user: User): Promise<User> {
  console.log(`I'm confused, user intent was ${user.intent.action}`);
  return Promise.resolve(user);
}

function chatSkill(user: User): Promise<User> {
  switch(user.intent.action) {
    case 'hello':
      console.log('Hi there! Would you like to know the weather?');
      user.state = 'hello';
      return Promise.resolve(user);

    case 'help':
      console.log('Hi there! just tell me what city you want to know the weather in...');
      user.state = 'help';
      return Promise.resolve(user);

    case 'yes':
      if (user.state === 'hello') { // user responded yes to 'would you like to know the weather?'
        console.log('Great, what city?');
        user.state = 'city';
        return Promise.resolve(user);
      }
      return null; //return null if skill can't process intent;

    case 'no':
      if (user.state === 'hello') { // user responded no to 'would you like to know the weather?'
        console.log('Why not?');
        user.state = 'none';
        return Promise.resolve(user);
      }
      return null; //return null if skill can't process intent;

    default:
      return null; //return null if skill can't process intent;
  }
}

//add skills to bot, skills are run all at once, but prioritized first to last
bot.unshiftSkill(confusedSkill);
bot.unshiftSkill(chatSkill);
bot.unshiftSkill(weatherSkill);
```

### Run user input
```typescript
const emptyUser: User = {
  state: 'none',
  intent: {
    action: 'none',
  },
};

console.log('- hi');
bot.processText(emptyUser, 'hi')
  .then((user: User) => {
    console.log('- yes');
    return bot.processText(user, 'yes');
  })
  .then((user: User) => {
    console.log('- london');
    return bot.processText(user, 'london');
  })
  .then((user: User) => {
    console.log('- help');
    return bot.processText(user, 'help');
  })
  .then((user: User) => {
    console.log('- what\'s the weather in London?');
    return bot.processText(user, 'what\'s the weather in London?');
  });
```
