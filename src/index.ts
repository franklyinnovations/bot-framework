import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as util from 'util';

import { classifier, GenerateClassifier, TopicCollection, Classifiers, Classification, checkUsingClassifier, runThroughClassifiers } from './classifier';
import { grabTopics, locatonExtractor, getLocationConfidence } from './helpers';

export { TopicCollection } from './classifier';

export interface Intent {
  action: string;
  topic: string;
  details: {
    confidence: number;
  } | any;
}

export interface User {
  conversation?: Array<string>;
  state: any;
  intent: Intent;
}

export interface IntentFunction {
  (text: string, user?: User): Promise<Intent>;
}

export interface SkillFunction {
  (user: User): Promise<User>;
}

export interface ReducerFunction {
  (intents: Array<Intent>, user?: User): Promise<Intent>;
}

export const defaultClassifierDirectories: Array<string> = [`${__dirname}/../nlp/phrases`];

export default class ChatBot {
  public classifiers: Classifiers;
  private intents: Array<IntentFunction>;
  private skills: Array<SkillFunction>;
  private reducer: ReducerFunction;
  private debugOn: Boolean;

  constructor(classifierFiles: Array<string|TopicCollection> = defaultClassifierDirectories) {
    const allClassifiers = GenerateClassifier(classifierFiles);
    this.classifiers = allClassifiers;
    // console.log(_.keys(this.classifiers));
    this.intents = [ baseBotTextNLP.bind(this), locationNLP.bind(this), grabTopics.bind(this) ];
    this.skills = [];
    this.reducer = defaultReducer.bind(this);
    this.debugOn = false;
    return this;
  }

  public addIntent(newIntent: IntentFunction) {
    this.intents = [].concat(this.intents, newIntent.bind(this));
    return this;
  }

  public unshiftIntent(newIntent: IntentFunction) {
    this.intents = [].concat(newIntent.bind(this), this.intents);
    return this;
  }

  public addSkill(newSkill: SkillFunction) {
    this.skills = [].concat(this.skills, newSkill.bind(this));
    return this;
  }

  public unshiftSkill(newSkill: SkillFunction) {
    this.skills = [].concat(newSkill.bind(this), this.skills);
    return this;
  }

  public setReducer(newReducer: ReducerFunction) {
    this.reducer = newReducer.bind(this);
    return this;
  }

  public turnOnDebug() {
    this.debugOn = true;
    return this;
  }

  public retrainClassifiers(classifierFiles: Array<string|TopicCollection> = defaultClassifierDirectories) {
    const allClassifiers = GenerateClassifier(classifierFiles);
    this.classifiers = allClassifiers;
  }

  public getTopics(): any {
    const topics = _.mapValues(this.classifiers, (value, key) => _.keys(value).map(key => key.replace(/-/g, ' ')));
    return topics;
  }

  public createEmptyIntent(): Intent {
    return {
      action: null,
      details: {
        confidence: 0,
      },
      topic: null,
    };
  }

  public createEmptyUser(defaults: any = {}): User {
    const anEmptyUser: User = {
      conversation: [],
      intent: this.createEmptyIntent(),
      state: 'none',
    };
    return _.defaults(anEmptyUser, defaults) as User;
  }

  public processText<U extends User>(user: U, text: string): Promise<U> {
    if (typeof user.conversation === 'undefined') {
      user.conversation = [];
    }
    user.conversation = user.conversation.concat(text);
    return Promise.map(this.intents, intent => intent(text, user))
      .then(_.flatten)
      .then(_.compact)
      .then((intents: Array<Intent>) => this.reducer(intents, user))
      .then(intent => {
        user.intent = intent;
        for (let i = 0; i < this.skills.length; i++) {
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

export function baseBotTextNLP(text: string): Promise<Array<Intent>> {
  const compacted = runThroughClassifiers(text, this.classifiers, true);

  if (compacted.length === 0) {
    return null;
  }
  const sorted: Array<Classification> = _.orderBy(compacted, ['value'], 'desc');
  if (this && this.debugOn) { console.log(`${text}\n${util.inspect(sorted, { depth:null })}`); };

  const intents: Array<Intent> = sorted.map(intent => {
    const baseIntent: Intent = {
      action: intent.label,
      details: {
        confidence: intent.value,
      },
      topic: intent.topic,
    };

    return baseIntent;
  });

  return Promise.resolve(intents);
}

export function locationNLP(text: string): Promise<Array<Intent>> {
  const locations = locatonExtractor(text);
  if (_.keys(locations).length === 0) {
    return Promise.resolve([]);
  }

  const action: string = _.keys(locations)[0];
  const city: string = locations[action][0];

  const intent: Intent = {
    action: action,
    details: {
      confidence: getLocationConfidence(text, city),
    },
    topic: 'locations',
  };

  return Promise.resolve([intent]);
}

export function defaultReducer(intents: Array<Intent>): Promise<Intent> {
  return Promise.resolve(_.compact(intents))
    .then((validIntents: Array<Intent>) => _.orderBy(validIntents, (intent: Intent) => intent.details.confidence || 0, 'desc'))
    .then((validIntents: Array<Intent>) => {
      if (this.debugOn) { console.log('validIntents', util.inspect(validIntents, { depth: null })); };
      if (validIntents.length === 0) {
        const unknownIntent: Intent = {
          action: 'none',
          details: {
            confidence: 0,
          },
          topic: null,
        };
        return unknownIntent;
      }
      const mergedDetails = _.defaults.apply(this, validIntents.map(intent => intent.details));
      const firstIntent = validIntents[0];
      firstIntent.details = mergedDetails;
      if (this.debugOn) { console.log(firstIntent); };
      return firstIntent;
    });
}
