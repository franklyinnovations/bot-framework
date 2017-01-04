import * as _ from 'lodash';
import * as Promise from 'bluebird';

import { classifier, GenerateClassifier, TopicCollection, Classifiers, Classification, checkUsingClassifier, runThroughClassifiers } from './classifier';
import { PlatformMiddleware } from './types/platform';
import { Intent, Incoming, Outgoing, IncomingMessage, IntentGenerator, ReducerFunction, ScriptFunction, GreetingFunction } from './types/bot';
import { UserMiddleware, User } from './types/user';

export { TopicCollection } from './classifier';
export { Intent, PlatformMiddleware };

import * as Platforms from './platforms';
export { Platforms };

import MemoryStorage from './storage/memory';
import defaultReducer from './default-reducer';
import NLPEngine from './nlp';
import Script from './script';
import OutgoingClass from './outgoing';

export const defaultClassifierDirectories: Array<string> = [`${__dirname}/../nlp/phrases`];

const DEFAULT_SCRIPT = '';

export default class Botler {
  private intents: Array<IntentGenerator> = [];
  private reducer: ReducerFunction;
  private debugOn: Boolean = false;
  private userMiddleware: UserMiddleware;
  private platforms: Array<PlatformMiddleware> = [];
  private scripts: { [key: string]: Script } = {};
  private greetingScript: GreetingFunction;

  constructor(classifierFiles: Array<string|TopicCollection> = defaultClassifierDirectories) {
    const engine = new NLPEngine(classifierFiles);
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
    console.log(this.scripts);
    if (_.has(this.scripts, [topic, action]) === false) {
      _.set(this.scripts, [topic, action], []);
    }
    this.scripts[topic][action].push(script);
    return this;
  }

  public newScript(name: string = DEFAULT_SCRIPT) {
    const newScript = new Script(name);
    this.scripts[name] = newScript
    return newScript;
  }

  public getScript(name: string = DEFAULT_SCRIPT) {
    return this.scripts[name];
  }

  public addGreeting(script: GreetingFunction) {
    this.greetingScript = script;
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
      platform: null,
      state: null,
      script: null,
      _platform: null,
    };
    return _.defaults(defaults, anEmptyUser) as User;
  }

  public start() {
    this.platforms.forEach(platform => platform.start());
  }

  public stop() {
    this.platforms.forEach(platform => platform.stop());
  }

  public processGreeting<U extends User>(user: U): void {
    if (this.greetingScript) {
      this.greetingScript(user, new OutgoingClass(user))
    }
    return;
  }

  public processMessage<U extends User>(user: U, message: IncomingMessage): Promise<void> {
    console.log(user);
    console.log(message);
    if (typeof user.conversation === 'undefined') {
      user.conversation = [];
    }

    user.conversation = user.conversation.concat(message);
    return this.getIntents(user, message)
      .then(intents => this.reducer(intents, user))
      .then(intent => {
        const topic = intent.topic;
        const action = intent.action;
        const request: Incoming = {
          user: user,
          message: message,
          intent: intent,
        };
        console.log(request);
        if (user.script && this.scripts[user.script]) {
          this.scripts[user.script].run(request);
        } else if (this.scripts[DEFAULT_SCRIPT]) {
          this.scripts[DEFAULT_SCRIPT].run(request);
        }
      })
      .catch((err: Error) => {
        console.error('error caught');
        console.error(err);
      });
  }

  private getIntents(user: User, message: IncomingMessage): Promise<Array<Intent>> {
    return Promise.map(this.intents, intent => intent.getIntents(message, user))
      .then(_.flatten)
      .then(_.compact);
  }
}