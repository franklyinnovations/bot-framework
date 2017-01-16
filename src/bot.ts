import * as _ from 'lodash';
import * as Promise from 'bluebird';

import { TopicCollection } from './classifier';
import { PlatformMiddleware } from './types/platform';
import { Intent, Incoming, IncomingMessage, IntentGenerator, ReducerFunction, GreetingFunction, DialogFunction, Outgoing, StopFunction } from './types/bot';
import { UserMiddleware, User, BasicUser } from './types/user';

export { TopicCollection } from './classifier';
export { Intent, PlatformMiddleware };

import MemoryStorage from './storage/memory';
import defaultReducer from './default-reducer';
import NLPEngine from './nlp';
import Script, { EndScriptException, stopFunction } from './script';
import OutgoingClass from './outgoing';
import { Greeting } from './types/messages/greeting';

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
  private onErrorScript: DialogFunction = defaultErrorScript; 

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
      scriptArguments: null,
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
    let request: Incoming = null;
    let response: Outgoing = null;
    return this.userMiddleware.getUser(basicUser)
      .then(completeUser => {
        completeUser.conversation = completeUser.conversation.concat(message);
        user = completeUser;
        response = new OutgoingClass(this, user);
        return completeUser;
      })
      .then(completeUser =>  this.getIntents(completeUser, message))
      .then(intents => this.reducer(intents, user))
      .then(intent => {
        request = {
          intent: intent,
          message: message,
          user: user,
        };
        return this._process(user, request, response);
      })
      .then(() => this.userMiddleware.saveUser(user))
      .then(() => { return; });
  }

  public startScript(user: User, name: string, scriptArguments: any = {}) {
    user.script = name;
    user.scriptStage = -1;
    user.scriptArguments = scriptArguments;
    return this.processMessage(user, _.last(user.conversation));
  }

  private getIntents(user: User, message: IncomingMessage): Promise<Array<Intent>> {
    return Promise.map(this.intents, intent => intent.getIntents(message, user))
      .then(_.flatten)
      .then(_.compact);
  }

  private _process(user: User, request: Incoming, response: Outgoing): Promise<void> {
    return Promise.resolve()
      .then(() => {
        const blankScript = function() { return Promise.resolve(); };
        let nextScript = blankScript;
        if (this.scripts[DEFAULT_SCRIPT]) {
          nextScript = function() { 
            console.log('running default');
            return this.scripts[DEFAULT_SCRIPT].run(request, blankScript); 
          }.bind(this);
        }
        if (user.script != null && this.scripts[user.script]) {
          return this.scripts[user.script].run(request, response, nextScript);
        } else if (this.scripts[DEFAULT_SCRIPT]) {
          return this.scripts[DEFAULT_SCRIPT].run(request, response, blankScript);
        } else {
          return Promise.resolve();
        }
      })
      .catch((err: Error) => {
        if (err instanceof EndScriptException) {
          if (user.script === null) {
            return;
          }
          user.script = null;
          user.scriptStage = -1;
          user.scriptArguments = {};
          return this._process(user, request, response);
        } else {
          console.error('error caught');
          console.error(err);
          return this.onErrorScript(request, response, stopFunction);
        }
      })
  }
}

const defaultErrorScript: DialogFunction  = function(incoming: Incoming, response: Outgoing, stop: StopFunction) {
  response.sendText('Uh oh, something went wrong, can you try again?');
  return Promise.resolve();
}