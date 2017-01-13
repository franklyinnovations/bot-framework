import * as _ from 'lodash';
import * as Promise from 'bluebird';

import { TopicCollection } from './classifier';
import { PlatformMiddleware } from './types/platform';
import { Intent, Incoming, IncomingMessage, IntentGenerator, ReducerFunction, GreetingFunction } from './types/bot';
import { UserMiddleware, User, BasicUser } from './types/user';

export { TopicCollection } from './classifier';
export { Intent, PlatformMiddleware };

import * as Platforms from './platforms';
export { Platforms };

import MemoryStorage from './storage/memory';
import defaultReducer from './default-reducer';
import NLPEngine from './nlp';
import Script from './script';
import OutgoingClass from './outgoing';
import { Greeting } from './types/messages/greeting';
import { MessageTypes } from './types/message'
export { MessageTypes };

export const defaultClassifierDirectories: Array<string> = [`${__dirname}/../nlp/phrases`];

const DEFAULT_SCRIPT = '';

export default class Botler {
  public debugOn: Boolean = false;

  private intents: Array<IntentGenerator> = [];
  private reducer: ReducerFunction;
  private userMiddleware: UserMiddleware;
  private platforms: Array<PlatformMiddleware> = [];
  private scripts: { [key: string]: Script } = {};
  private greetingScript: GreetingFunction;

  constructor(classifierFiles: Array<string|TopicCollection> = defaultClassifierDirectories) {
    const engine = new NLPEngine(classifierFiles);
    this.intents = [ engine ];
    this.reducer = defaultReducer.bind(this);
    this.setUserMiddlware(new MemoryStorage(this));
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

  public newScript(name: string = DEFAULT_SCRIPT) {
    const newScript = new Script(this, name);
    this.scripts[name] = newScript;
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
      _platform: null,
      conversation: [],
      id: null,
      platform: null,
      script: null,
      scriptStage: 0,
      state: null,
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
    const greetingMessage: Greeting = {
      type: 'greeting',
    };
    user.conversation = user.conversation.concat(greetingMessage);
    if (this.greetingScript) {
      this.greetingScript(user, new OutgoingClass(this, user));
    }
    return;
  }

  public processMessage(basicUser: BasicUser, message: IncomingMessage): Promise<void> {
    let user: User = null;
    return this.userMiddleware.getUser(basicUser)
      .then(completeUser => {
        completeUser.conversation = completeUser.conversation.concat(message);
        user = completeUser;
        return completeUser;
      })
      .then(completeUser =>  this.getIntents(completeUser, message))
      .then(intents => this.reducer(intents, user))
      .then(intent => {
        const request: Incoming = {
          intent: intent,
          message: message,
          user: user,
        };
        const blankScript = function() { return Promise.resolve(); };
        let nextScript = blankScript;
        if (this.scripts[DEFAULT_SCRIPT]) {
          nextScript = function() { return this.scripts[DEFAULT_SCRIPT].run(request, blankScript); }.bind(this);
        }
        if (user.script && this.scripts[user.script]) {
          this.scripts[user.script].run(request, nextScript);
        } else if (this.scripts[DEFAULT_SCRIPT]) {
          return this.scripts[DEFAULT_SCRIPT].run(request, blankScript);
        }
      })
      .catch((err: Error) => {
        console.error('error caught');
        console.error(err);
      })
      .then(() => this.userMiddleware.saveUser(user))
      .then(() => { return; });
  }

  private getIntents(user: User, message: IncomingMessage): Promise<Array<Intent>> {
    return Promise.map(this.intents, intent => intent.getIntents(message, user))
      .then(_.flatten)
      .then(_.compact);
  }
}
