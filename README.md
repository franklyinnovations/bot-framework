## Botler - build contextual chat bots

Botler was developed to let [fynd](https://fynd.me) build a contextual-aware chatbot to be everyone's favorite personal shopper. We found that many chatbots and pre-exisiting chatbot frameworks were fine at simple action => response behavior, but weren't great at using contextual clues to prove a more fluid experience.

A second goal of Botler was to provide as much general out-of-the-box language functionality as possible. We shouldn't keep reiventing the NLP wheel.

# Components
Botler uses three components to build a bot, **intents**, **actions** and the **reducer**.
* **Intents** take a text input (and potential the conversation so far) and return the intent of the user, for example "tell me weather in London" maps to {action:'weather', details:{ location: 'London' } }
* **Actions** take intents and the state of the conversation to run an action such as querying an API and sending the results to the user
* The **Reducer** takes multiple intents and reduces it to the correct one

# Installation
```bash
$ npm install --save botler
```

# Weather Bot Example
```typescript
const Botler = require('botler');
const bot = new Botler();
````

# Adding new intents
