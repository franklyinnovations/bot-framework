# Botler - build contextual chat bots

Botler was developed to let [fynd](https://fynd.me) build a contextual-aware chatbot to be everyone's favorite personal shopper. We found that many chatbots and pre-exisiting chatbot frameworks were fine at simple action => response behavior, but weren't great at using contextual clues to prove a more fluid experience.

A second goal of Botler was to provide as much general out-of-the-box language functionality as possible. We shouldn't keep reiventing the NLP wheel.

## Components
Botler uses three components to build a bot, **intents**, **actions** and the **reducer**.
* **Intents** take a text input (and potential the conversation so far) and return the intent of the user, for example "tell me weather in London" maps to {action:'weather', details:{ location: 'London' } }
* **Actions** take intents and the state of the conversation to run an action such as querying an API and sending the results to the user
* The **Reducer** takes multiple intents and reduces it to the correct one

## Built-in functionality
Botler comes with a few key intents already installed. Some are
* help for example if the user types "help", "instruction", etc
* yes
* no
* hello

## Adding new phrases
Just make a directory of Javascript files that each are named for the intent and export an array of strings representing that phrase and run the baysian classifier engine locally.
```javascript
/// nlp\phrases\weather.js
module.exports = [ 'what\'s the weather in', 'weather', 'tell me the forecast'];
```
```bash
$ generate-classifiers .\nlp\phrases\
```

## Installation
```bash
$ npm install --save botler
```

## Weather Bot Example
### Import
```typescript
const Botler = require('botler');
import { User, Intent } from 'botler';
```

### Adding weather based phrase detection
```bash
$ generate-classifiers .\nlp\phrases\
```
```typescript
//teach bot about weather
const bot = new Botler(['.\nlp\classifiers.json']);

function weatherSkill(user: User): Promise<User> {
  if (user.intent.action === 'weather') {
    if (user.intent.location.length === 0) {
      console.log('What city would you like the weather for?')
      user.state = 'city';
      return Promise.resolve(user);
    } else {
      // return weatherapi(...).then(()=>user);
      console.log(`the weather in ${user.intent.location[0]} will be sunny`);
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
  console.log(`user intent was ${user.intent}`);
  return Promise.resolve(user);
}

function chatSkill(user: User): Promise<User> {
  switch(user.intent.action) {
    case 'hello':
      console.log('would you like to know the weather?');
      user.state('hello');
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
bot.processText(emptyUser, 'hi');
bot.processText(emptyUser, 'what's the weather in new york?');
```

