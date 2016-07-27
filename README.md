# Botler - Build contextual chat bots

Botler was developed to let [fynd](https://fynd.me) build [fyndbot](https://m.me/shopfynd).
We wanted a contextual-aware chatbot to be everyone's favorite personal shopper. We found that many chatbots and pre-exisiting chatbot frameworks were fine at simple action => response behavior, but weren't great at using contextual clues to prove a more fluid experience.

Another goal of Botler was to provide as much general out-of-the-box language functionality as possible. We shouldn't keep reiventing the NLP wheel and the more pre-defined behavior everyone adds, the smarter all the bots get.

## Components
Botler uses three components to build a bot, **intents**, **actions** and the **reducer**.
* **[Intents](./doc/intents.md)** take a text input (and potential the conversation so far) and return the intent of the user, for example "tell me weather in London" maps to ```{action:'weather', topic: 'weather, details:{ location: 'London' } }```
* The **[Reducer](./doc/reducer.md)** takes multiple detected intents and reduces it to the correct one
* **[Skills](./doc/skills.md)** take intents and the state of the conversation to run an action such as querying an API and sending the results to the user

## The User
The **User** is a simple object the holds the current state, detected intent, and conversation (if intents require rocessing of the entire conversation). It is easily entended by adding more keys to hold application specific info (such as a unique user id to respond to).

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
While private: http://stackoverflow.com/questions/28728665/how-to-use-private-github-repo-as-npm-dependency

## Examples
[Weather bot examples](./examples/rainbot) (most simple example)  
[Buzzfeed based news bot](./examples/buzzer) (more complex)  

## A weather chatbot in less than [100 lines](./examples/rainbot/build/index.js)!

### First let's teach botler what weather is
Just make a directory named the topic of the intent. Inside we will have a few JSON files that each are named for the intent action and are an array of strings representing the different forms of the phrasing of the action.

This will add the intent topic 'weather' with the two intents 'weather' and 'rain'.
#### weather.json
```json
[ "what's the weather in", "weather", "tell me the forecast"]
```
#### rain.json
```json
[ "is it raining", "will it rain"]
```
#### Directory structure
```
|-- build
|-- lib
|-- nlp
  |-- weather
    |-- weather.json
    |-- rain.json
|-- src
```

Let's teach botler about some cities too
#### new_york.json
```json
[ "new york", "nyc", "JFK"]
```
#### london.json
```json
[ "london", "lhr"]
```
#### Directory structure
```
|-- build
|-- lib
|-- nlp
  |-- weather
    |-- weather.json
    |-- rain.json
  |-- location
    |-- new_york.json
    |-- london.json
|-- src
```

### Import Botler
```typescript
import Botler, { User, Intent, defaultReducer } from 'botler';
import * as util from 'util';
```

### Adding weather based phrase detection
```typescript
//teach bot about weather using the previously created intent phrases
const bot = new Botler([`${__dirname}/../nlp`]);
//botler now knows about weather and some cities
```

### Add a skill to grab the weather
```typescript
function weatherSkill(user: User): Promise<User> {
  const weather = ['sunny', 'rainy', 'cloudy']; //there are only three posibilities

  // if we've detected a city (new york or london) then let's get a forecast
  if (user.intent.topic === 'location') {
    //just make the city name pretty new_york => 'new york'
    const city = user.intent.action.replace('_', ' '); 

    user.state = 'none';
    return sendToUser(`the weather in ${city} will be ${weather[Math.floor(Math.random()*weather.length)]}`)
      .then(() => user);
    /// weatherAPI(city)
    ///  .then(forecast => sendToUser(`forecase is ${forecast}`))
    ///  .then(() => user);
  }

  // botler has some helpers that are always running, such as looking for dates and numbers in the users text
  // if the user has entered a number that is 5 digits, let's assume it's a zip code
  if (user.intent.topic === 'details' && user.intent.details.value.toString().length === 5) {
    const zip = user.intent.details.value;
    user.state = 'none';
    return sendToUser(`the weather at ${zip} will be ${weather[Math.floor(Math.random()*weather.length)]}`)
      .then(() => user);
  }

  return null;  //return null if skill can't process this intent;
}
```

### Adding new actions for basic chat functionarly
```typescript
function chatSkill(user: User): Promise<User> {
  // decide how to respond based on the users intent
  switch(user.intent.action) {
    case 'hello': // user said hello
      user.state = 'hello';
      return sendToUser('Hi there! Would you like to know the weather?')
        .then(() => user);

    case 'help':  // user asked for help
      user.state = 'help';
      return sendToUser('Hi there! just tell me what city you want to know the weather in...')
        .then(() => user);

    case 'weather': // user asked about the weather but didn't provide a location
      user.state = 'location';
      return sendToUser('What city do you want to know the weather in?')
        .then(() => user);

    case 'yes': // user said yes, check the state of the coversation to figure out what they said yes to
      if (user.state === 'hello') { // user responded yes to 'would you like to know the weather?'
        user.state = 'city';
        return sendToUser('Great, what city?')
          .then(() => user);
      }
      return null; //return null if skill can't process intent;

    case 'no':
      if (user.state === 'hello') { // user responded no to 'would you like to know the weather?'
        user.state = 'none';
        return sendToUser('Why not?')
          .then(() => user);
      }
      return null; //return null if skill can't process intent;

    default:
      return null; //return null if skill can't process intent;
  }
}

function confusedSkill(user: User): Promise<User> {
  // catch all chat response if Botler couldn't detect a valid intent or the intent wasn't valid
  // with the current user state
  // console.log(`I'm confused, user intent was ${user.intent.action}`);
  return sendToUser('I\'m confused')
    .then(() => user);
}
```

### Reducer that prioritizes location
```typescript
function weatherReducer(intents: Array<Intent>): Promise<Intent> {
  if (this && this.debugOn) console.log('intents:', util.inspect(intents, { depth:null }));

  //if we detect a location, prioritize that intent and return it
  const location = intents.filter(intent => intent.topic === 'location');
  if (location.length > 0) {
    return Promise.resolve(location[0]);
  }

  //otherwise just do the normal thing
  return defaultReducer(intents);
}
```

### Mock functions for I/O
```typescript
function sendToUser(text: string): Promise<void> {
  console.log(`<- ${text}`);
  return Promise.resolve();
}

function receiveFromUser(user: User, text: string): Promise<User> {
  console.log(`-> ${text}`);
  return bot.processText(user, text);
}
```

### Run user input
```typescript
// create an empty user and then add some custom info
const emptyUser: User = bot.createEmptyUser({ apiUserID: 'custom_info' });

// this could be an sample conversation
receiveFromUser(emptyUser, 'hi')
  .then((user: User) => {
    return receiveFromUser(user, 'yes');
  })
  .then((user: User) => {
    return receiveFromUser(user, 'london');
  })
  .then((user: User) => {
    return receiveFromUser(user, 'help');
  })
  .then((user: User) => {
    return receiveFromUser(user, 'what\'s the weather in London?');
  })
  .then((user: User) => {
    //should cause confusion
    return receiveFromUser(user, 'you\'re the best!');
  })
  .then((user: User) => {
    return receiveFromUser(user, 'What\'s the weather in New York, NY tomorrow');
  })
  .then((user: User) => {
    return receiveFromUser(user, 'How about at 10004');
  });
```
