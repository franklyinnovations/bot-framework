import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as util from 'util';

import { classifier, GenerateClassifier, TopicCollection, Classifiers, Classification, checkUsingClassifier, runThroughClassifiers } from './classifier';
import { grabTopics, locatonExtractor, getLocationConfidence } from './helpers';
import { PlatformMiddleware } from './types/platform';
import { Intent, IncomingMessage, IntentFunction, ReducerFunction, ScriptFunction } from './types/bot';
import { UserMiddleware, User } from './types/user';

export { TopicCollection } from './classifier';

import MemoryStorage from './storage/memory';

// export type Session = 

export const defaultClassifierDirectories: Array<string> = [`${__dirname}/../nlp/phrases`];

export default class ChatBot {
  public classifiers: Classifiers;
  private intents: Array<IntentFunction> = [];
  private reducer: ReducerFunction;
  private debugOn: Boolean = false;
  private userMiddleware: UserMiddleware;
  private platforms: Array<PlatformMiddleware> = [];
  private scripts: { [key: string]: { [key: string]: Array<ScriptFunction> } };

  constructor(classifierFiles: Array<string|TopicCollection> = defaultClassifierDirectories) {
    const allClassifiers = GenerateClassifier(classifierFiles, `${__dirname}/../nlp/classifiers.json`);
    this.classifiers = allClassifiers;
    // console.log(_.keys(this.classifiers));
    this.intents = [ baseBotTextNLP.bind(this), locationNLP.bind(this), grabTopics.bind(this) ];
    this.reducer = defaultReducer.bind(this);
    this.setUserMiddlware(new MemoryStorage());
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

  public _addScript(topic: string, action: string, script: ScriptFunction) {
    if (_.isArray(this.scripts[topic][action]) === false) {
      this.s
    }
    this.scripts[topic][action].push(script);
  }

  public setReducer(newReducer: ReducerFunction) {
    this.reducer = newReducer.bind(this);
    return this;
  }

  public setUserMiddlware(middleware: UserMiddleware) {
    this.userMiddleware = middleware;
    return this;
  }

  public addPlatform(platform: PlatformMiddleware) {
    this.platforms.push(platform);
    return this;
  }

  public turnOnDebug() {
    this.debugOn = true;
    return this;
  }

  public getUser() {
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
      id: null,
      intent: this.createEmptyIntent(),
      platform: null,
      state: 'none',
    };
    return _.defaults(anEmptyUser, defaults) as User;
  }

  public start() {
    this.platforms.forEach(platform => platform.start());
  }

  public stop() {
    this.platforms.forEach(platform => platform.stop());
  }

  public processMessage<U extends User>(user: U, message: IncomingMessage): Promise<U> {
    if (typeof user.conversation === 'undefined') {
      user.conversation = [];
    }

    user.conversation = user.conversation.concat(message);
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
  const compacted = runThroughClassifiers(text, this.classifiers);

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
