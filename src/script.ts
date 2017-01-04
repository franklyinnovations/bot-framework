import * as _ from 'lodash';
import { Intent, Incoming, Outgoing, IncomingMessage, IntentGenerator, ReducerFunction, ScriptFunction, GreetingFunction } from './types/bot';
import OutgoingClass from './outgoing';

export default class Script {
    private dialogs: { [key: string]: { [key: string]: Array<ScriptFunction> } } = {};
    private name: string;
    constructor(scriptName: string) {
        this.name = scriptName;
        return this;
    }

    public run(incoming: Incoming) {
        const topic = incoming.intent.topic;
        const action = incoming.intent.action;
        let validScripts: Array<ScriptFunction> = [];
        if (_.has(this.dialogs, [topic, action])) {
          validScripts = validScripts.concat(this.dialogs[topic][action]);
        }
        if (_.has(this.dialogs, [topic, ''])) {
          validScripts = validScripts.concat(this.dialogs[topic]['']);
        }
        if (_.has(this.dialogs, ['', ''])) {
          validScripts = validScripts.concat(this.dialogs['']['']);
        }
        return this.callScript(incoming, validScripts);
    }

    private _addDialog(topic: string, action: string, script: ScriptFunction) {
    console.log(this.dialogs);
    if (_.has(this.dialogs, [topic, action]) === false) {
      _.set(this.dialogs, [topic, action], []);
    }
    this.dialogs[topic][action].push(script);
    return this;
  }

  public addDialog(dialogFunction: ScriptFunction) {
    if (arguments.length === 3) {
      return this._addDialog(arguments[0], arguments[1], arguments[3]);
    }
    if (arguments.length === 2) {
      return this._addDialog(arguments[0], '', arguments[1]);
    }
    if (arguments.length === 1) {
      return this._addDialog('', '', arguments[0]);
    }
    throw new Error('Bad argument count');
  }

  private callScript(request: Incoming, scripts: Array<ScriptFunction>): Promise<void> {
    if (scripts.length > 0) {
      return Promise.resolve();
    }

    const response = new OutgoingClass(request.user);
    const currentScript = _.head(scripts);
    const nextScripts = _.tail(scripts);
    const nextFunction = this.callScript.bind(this, request, nextScripts);
    return Promise.resolve(currentScript(request, response, nextFunction));
  }
}