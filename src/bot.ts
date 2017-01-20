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
import Script, { EndScriptException, stopFunction, StopException, StopScriptReasons} from './script';
import OutgoingClass from './outgoing';
import { GreetingMessage } from './types/messages/greeting';

export const defaultClassifierDirectories: Array<string> = [`${__dirname}/../nlp/phrases`];

const DEFAULT_SCRIPT = '';

export default class Botler {
  public debugOn: Boolean = false;

  private intents: Array<IntentGenerator> = [];
  private reducer: ReducerFunction;
  public userMiddleware: UserMiddleware;
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

  public addErrorHandler(dialog: DialogFunction) {
    this.onErrorScript = dialog;
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

  public processGreeting(user: BasicUser): Promise<void> {
    const greetingMessage: GreetingMessage = {
      type: 'greeting',
    };
    return this.processMessage(user, greetingMessage);
  }

  public processMessage(basicUser: BasicUser, message: IncomingMessage): Promise<void> {
    let user: User = null;
    let request: Incoming = null;
    let response: Outgoing = null;
    return this.userMiddleware.getUser(basicUser)
      .catch((err: Error) => _.merge(this.createEmptyUser(), basicUser))
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
        return this._process(user, request, response, true);
      })
      .then(() => this.userMiddleware.saveUser(user))
      .then(() => { return; });
  }

  private getIntents(user: User, message: IncomingMessage): Promise<Array<Intent>> {
    return Promise.map(this.intents, intent => intent.getIntents(message, user))
      .then(_.flatten)
      .then(_.compact);
  }

  private _process(user: User, request: Incoming, response: Outgoing, directCall: boolean = false): Promise<void> {
    return Promise.resolve()
      .then(() => {
        const blankScript = function() { return Promise.resolve(); };
        let nextScript = blankScript;
        if (this.scripts[DEFAULT_SCRIPT]) {
          nextScript = function() {
            return this.scripts[DEFAULT_SCRIPT].run(request, blankScript); 
          }.bind(this);
        }

        if (request.message.type === 'greeting' && user.script === null && directCall === true) {
          if (this.greetingScript) {
            return Promise.resolve()
              .then(() => this.greetingScript(user, response))
              .then(() => {
                if (this.scripts[DEFAULT_SCRIPT]) {
                  return this.scripts[DEFAULT_SCRIPT].run(request, response, blankScript, -1);
                }
              });
          } else {
            user.script = null;
            user.scriptStage = -1;
          }
        }
        if (user.script != null && user.script !== DEFAULT_SCRIPT && this.scripts[user.script]) {
          return this.scripts[user.script].run(request, response, nextScript);
        } else if (this.scripts[DEFAULT_SCRIPT]) {
          return this.scripts[DEFAULT_SCRIPT].run(request, response, blankScript, user.scriptStage);
        } else {
          throw new Error('No idea how to chain the scripts');
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
        } else if (err instanceof StopException) {
          if (err.reason === StopScriptReasons.NewScript) {
            return this._process(user, request, response);
          }
          return;
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