const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');
const util = require('util');

const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
import { classifier, GenerateClassifier } from './classifier';
import { grabTopics } from './helpers';

let classifiers = GenerateClassifier([`${__dirname}/../nlp/phrases`]);

export interface Intent {
  action: string,
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
  private debugOn: Boolean;
  public classifiers: any;

  constructor(classifierFiles: Array<string> = []) {
    const newClassifiers = GenerateClassifier(classifierFiles);
    this.classifiers = _.defaults(classifiers, newClassifiers);
    // console.log(_.keys(classifiers));
    this.intents = [ baseBotTextNLP.bind(this), grabTopics.bind(this) ];
    this.skills = [];
    this.reducer = defaultReducer.bind(this);
    this.debugOn = false;
  }

  public unshiftIntent(newIntent: IntentFunction): void {
    this.intents = [].concat(newIntent.bind(this), this.intents);
  }

  public unshiftSkill(newSkill: SkillFunction): void {
    this.skills = [].concat(newSkill.bind(this), this.skills);
  }

  public setReducer(newReducer: Reducer): void {
    this.reducer = newReducer.bind(this);
  }

  public turnOnDebug(): void {
    this.debugOn = true;
  }

  public processText<U extends User>(user:U, text:string): Promise<U> {
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
    // if (this && this.debugOn) console.log(key, result);
    if (result.label === 'false') {
      return null;
    }
    return {
      label: key,
      value: result.value,
    };
  });

  let compacted = _.compact(filtered);
  if (classifier === natural.LogisticRegressionClassifier) {
    compacted = compacted.filter(result => result.value > 0.6);
  }
  if (compacted.length === 0) {
    return null;
  }
  const sorted = _.orderBy(compacted, ['value'], 'desc');
  if (this && this.debugOn) console.log(text, sorted);

  const intent: Intent = {
    action: sorted[0].label,
    details: {},
  }

  if (this && this.debugOn) intent.details.confidence = sorted[0].value;

  return Promise.resolve(intent);
}

export function defaultReducer(intents: Array<Intent>): Promise<Intent> {
  return Promise.resolve(_.compact(intents))
    .then((validIntents: Array<Intent>) => {
      if (this.debugOn) console.log('validIntents', util.inspect(validIntents, { depth: null }));
      if (validIntents.length === 0) {
        const unknownIntent: Intent = { action: 'none' };
        return unknownIntent;
      }
      const mergedDetails = _.defaults.apply(this, validIntents.map(intent => intent.details));
      const firstIntent = validIntents[0];
      firstIntent.details = mergedDetails;
      if (this.debugOn) console.log(firstIntent);
      return firstIntent;
    })
}
