import * as _ from 'lodash';
import * as Promise from 'bluebird';

import { classifier, GenerateClassifier, TopicCollection, Classifiers, Classification, checkUsingClassifier, runThroughClassifiers } from './classifier';
import { PlatformMiddleware } from './types/platform';
import { Intent, IncomingMessage, IntentGenerator, ReducerFunction, ScriptFunction, GreetingFunction } from './types/bot';
import { UserMiddleware, User } from './types/user';

export { TopicCollection } from './classifier';

import MemoryStorage from './storage/memory';
import defaultReducer from './default-reducer';
import NLPEngine from './nlp';
// export type Session = 

export const defaultClassifierDirectories: Array<string> = [`${__dirname}/../nlp/phrases`];

export default class ChatBot {
  private intents: Array<IntentGenerator> = [];
  private reducer: ReducerFunction;
  private debugOn: Boolean = false;
  private userMiddleware: UserMiddleware;
  private platforms: Array<PlatformMiddleware> = [];
  private scripts: { [key: string]: { [key: string]: Array<ScriptFunction> } };

  constructor(classifierFiles: Array<string|TopicCollection> = defaultClassifierDirectories) {
    const engine = new NLPEngine(classifierFiles);
    // console.log(_.keys(this.classifiers));
    this.intents = [ engine ];
    this.reducer = defaultReducer.bind(this);
    this.setUserMiddlware(new MemoryStorage());
    return this;
  }

  public addIntent(newIntent: IntentGenerator) {
    this.intents = [].concat(this.intents, newIntent);
    return this;
  }

  public unshiftIntent(newIntent: IntentGenerator) {
    this.intents = [].concat(newIntent, this.intents);
    return this;
  }

  public _addScript(topic: string, action: string, script: ScriptFunction) {
    if (_.has(this.scripts, [topic, action]) === false) {
      _.set(this.scripts, [topic, action], []);
    }
    this.scripts[topic][action].push(script);
    return this;
  }

  public addScript() {
    if (arguments.length === 3) {
      return this._addScript(arguments[0], arguments[1], arguments[3]);
    }
    if (arguments.length === 2) {
      return this._addScript(arguments[0], '', arguments[1]);
    }
    if (arguments.length === 1) {
      return this._addScript('', '', arguments[0]);
    }
    throw new Error('Bad argument count');
  }

  public addGreeting(scriot: GreetingFunction) {
    return this;
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

  public processMessage<U extends User>(user: U, message: IncomingMessage): Promise<void> {
    if (typeof user.conversation === 'undefined') {
      user.conversation = [];
    }

    user.conversation = user.conversation.concat(message);
    return this.getIntents(user, message)
      .then(intents => this.reducer(intents, user))
      .then(intent => {
        const topic = intent.topic;
        const action = intent.action;
        let validScripts: Array<ScriptFunction> = [];
        if (_.has(this.scripts, [topic, action])) {
          validScripts = validScripts.concat(this.scripts[topic][action]);
        }
        if (_.has(this.scripts, [topic, ''])) {
          validScripts = validScripts.concat(this.scripts[topic]['']);
        }
        if (_.has(this.scripts, ['', ''])) {
          validScripts = validScripts.concat(this.scripts['']['']);
        }
        return this.callScript(user, message, validScripts);
      });
  }

  private getIntents(user: User, message: IncomingMessage): Promise<Array<Intent>> {
    return Promise.map(this.intents, intent => intent.getIntents(message, user))
      .then(_.flatten)
      .then(_.compact);
  }

  private callScript(user: User, message: IncomingMessage, scripts: Array<ScriptFunction>): Promise<void> {
    if (scripts.length > 0) {
      return Promise.resolve();
    }
    const currentScript = _.head(scripts);
    const nextScripts = _.tail(scripts);
    const nextFunction = this.callScript.bind(this, user, message, nextScripts);
    return Promise.resolve(currentScript(user, message, nextFunction));
  }
}