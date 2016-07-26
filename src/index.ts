const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');
const util = require('util');

const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
import { classifier, GenerateClassifier } from './classifier';
import { grabTopics } from './helpers';

export interface Intent {
  action: string,
  topic: string,
  details?: any,
}

export interface User {
  conversation?: Array<string>,
  state: any,
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
    const builtInClassifiers = GenerateClassifier([`${__dirname}/../nlp/phrases`])
    const newClassifiers = GenerateClassifier(classifierFiles);
    this.classifiers = _.defaults(builtInClassifiers, newClassifiers);
    // console.log(_.keys(this.classifiers));
    this.intents = [ baseBotTextNLP.bind(this), grabTopics.bind(this) ];
    this.skills = [];
    this.reducer = defaultReducer.bind(this);
    this.debugOn = false;
    return this;
  }

  public unshiftIntent(newIntent: IntentFunction) {
    this.intents = [].concat(newIntent.bind(this), this.intents);
    return this;
  }

  public unshiftSkill(newSkill: SkillFunction) {
    this.skills = [].concat(newSkill.bind(this), this.skills);
    return this;
  }

  public setReducer(newReducer: Reducer) {
    this.reducer = newReducer.bind(this);
    return this;
  }

  public turnOnDebug() {
    this.debugOn = true;
    return this;
  }

  public processText<U extends User>(user:U, text:string): Promise<U> {
    if (typeof user.conversation === 'undefined') {
      user.conversation = [];
    }
    user.conversation = user.conversation.concat(text);
    return Promise.map(this.intents, intent => intent(text, user))
      .then(_.flatten)
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

interface Classification {
  label: string,
  topic: string,
  value: number,
}

function checkUsingClassifier(text: string, classifier: any, label: string, topic: string): Classification {
  const result = classifier.getClassifications(text)[0];
  if (result.label === 'false') {
    return null;
  }
  return {
    label,
    topic,
    value: result.value,
  };
}

export function baseBotTextNLP(text: string): Promise<Array<Intent>> {
  const filtered: Array<Array<Classification>> = _.map(this.classifiers, (classifiers, topic) => {
    const trueClassifications = _.map(classifiers, (classifier, label) => checkUsingClassifier(text, classifier, label, topic));
    // console.log(topic, trueClassifications);
    return _.compact(trueClassifications);
  });

  let compacted: Array<Classification> = _.compact(_.flatten(filtered));
  if (this && this.debugOn) console.log('compacted', compacted);

  if (classifier === natural.LogisticRegressionClassifier) {
    compacted = compacted.filter(result => result.value > 0.6);
  }

  if (compacted.length === 0) {
    return null;
  }
  const sorted: Array<Classification> = _.orderBy(compacted, ['value'], 'desc');
  if (this && this.debugOn) console.log(`${text}\n${sorted}`);

  const intents: Array<Intent> = sorted.map(intent => ({
    action: intent.label,
    topic: intent.topic,
    details: {
      confidence: intent.value,
    },
  }));

  return Promise.resolve(intents);
}

export function defaultReducer(intents: Array<Intent>): Promise<Intent> {
  return Promise.resolve(_.compact(intents))
    .then((validIntents: Array<Intent>) => {
      if (this.debugOn) console.log('validIntents', util.inspect(validIntents, { depth: null }));
      if (validIntents.length === 0) {
        const unknownIntent: Intent = { action: 'none', topic: null };
        return unknownIntent;
      }
      const mergedDetails = _.defaults.apply(this, validIntents.map(intent => intent.details));
      const firstIntent = validIntents[0];
      firstIntent.details = mergedDetails;
      if (this.debugOn) console.log(firstIntent);
      return firstIntent;
    })
}
