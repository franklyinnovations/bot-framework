const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');
const util = require('util');

const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

import { grabTopics } from './helpers';

const saved = JSON.parse(fs.readFileSync('./bot/nlp/classifiers.json', 'utf8'));
const classifiers = _.mapValues(saved, archived => {
  return natural.BayesClassifier.restore(JSON.parse(archived));
});

export interface Intent {
  request: string,
  details?: any,
}

export interface User {
  conversation?: Array<string>,
  state: string,
  intent: Intent,
}

export interface IntentFunction {
  (text: string, user?: User): Promise<Intent>;
}

export interface SkillFunction {
  (user: User): Promise<User>;
}

export interface Reducer {
  (intents: Array<Intent>, user: User): Promise<Intent>;
}

export default class ChatBot {
  private intents: Array<IntentFunction>;
  private skills: Array<SkillFunction>;
  private reducer: Reducer;

  constructor() {
    this.intents = [ baseBotTextNLP, grabTopics ];
    this.skills = [];
    this.reducer = defaultReducer;
  }

  public unshiftIntent(newIntent: IntentFunction): void {
    this.intents = [].concat(newIntent, this.intents);
  }

  public unshiftSkill(newSkill: SkillFunction): void {
    this.skills = [].concat(newSkill, this.skills);
  }

  public setReducer(newReducer: Reducer): void {
    this.reducer = newReducer;
  }

  public processResponse<U extends User>(user:U, text:string): Promise<U> {
    if (typeof user.conversation === 'undefined') {
      user.conversation = [];
    }
    user.conversation = user.conversation.concat(text);
    return Promise.map(this.intents, intent => intent(text, user))
      .then(this.reducer)
      .then(intent => {
        user.intent = intent;
        for(let i=0; i < this.skills.length; i++) {
          const result = this.skills[i](user);
          if (result !== null) {
            return result;
          }
        }
        return null;
      })
      .then(() => Promise.resolve(user));
  }
}

export function baseBotTextNLP(text: string): Promise<Intent> {
  const filtered = _.map(classifiers, (classifier, key) => {
    const result = classifier.getClassifications(text)[0];
    if (result.label === 'false') {
      return null;
    }
    return {
      label: key,
      value: result.value,
    };
  });

  const compacted = _.compact(filtered);
  if (compacted.length === 0) {
    return null;
  }
  const sorted = _.orderBy(compacted, ['value'], 'desc');
  console.log(sorted);

  const intent: Intent = {
    request: sorted[0].label,
    details: {},
  }
  return Promise.resolve(intent);
}

export function defaultReducer(intents: Array<Intent>): Promise<Intent> {
  return Promise.resolve(_.compact(intents))
    .then((validIntents: Array<Intent>) => {
      console.log(util.inspect(validIntents, { depth: null }));
      if (validIntents.length === 0) {
        return { request: 'none' };
      }
      const mergedDetails = _.defaults({}, validIntents.map(intent => intent.details));
      const firstIntent = validIntents[0];
      firstIntent.details = mergedDetails;
      console.log(firstIntent);
      return firstIntent;
    })
}
