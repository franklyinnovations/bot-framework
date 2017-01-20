import * as _ from 'lodash';
import * as Promise from 'bluebird';

import { Incoming, DialogFunction, Outgoing } from './types/bot';
import { MessageType, MessageTypes } from './types/message';

import Botler from './bot';

interface DialogPrototype {
  function: DialogFunction;
  force: boolean;
  blocking: boolean;
}

interface Dialog extends DialogPrototype {
  type: 'dialog';
  name: string;
}

interface Button extends DialogPrototype {
  type: 'button';
  button: string;
}

interface Expect extends DialogPrototype {
  type: 'expect';
  expect: {
    type: MessageType;
    catch: DialogFunction;
  };
  blocking: true;
}

interface Intent extends DialogPrototype {
  type: 'intent';
  intent: {
    topic: string;
    action: string;
  };
}

type DialogShell = Dialog | Button | Expect | Intent;

export enum StopScriptReasons {
  Called,
  NewScript,
  ExpectCaught,
}

export class StopException extends Error {
  public reason: StopScriptReasons;
  constructor(reason: StopScriptReasons) {
    super(`Script stopped due to ${StopScriptReasons[reason]}`);
    // Set the prototype explicitly.
    (<any> Object).setPrototypeOf(this, StopException.prototype);
    this.reason = reason;
  }
}

export enum EndScriptReasons {
  Called,
  Reached,
}

export class EndScriptException extends Error {
  public reason: EndScriptReasons;
  constructor(reason: EndScriptReasons) {
    super(`End of script due to ${EndScriptReasons[reason]}`);
    // Set the prototype explicitly.
    (<any> Object).setPrototypeOf(this, EndScriptException.prototype);
    this.reason = reason;
  }
}

export type FunctionShell = {
  (...args: any[]): (...args: any[]) => this;
};

export type DotAlways = {
  always: (...args: any[]) => this;
};

export type ExpectButton = (dialogFunction: DialogFunction) => this;
export type ExpectButtonWith = (postback: string, dialogFunction: DialogFunction) => this;

export type ExpectInput = {
  (...args: any[]): (...args: any[]) => this;
  text: (dialogFunction: DialogFunction) => this;
  button: ExpectButton | ExpectButtonWith;
};

export default class Script {
  private dialogs: Array<DialogShell> = [];
  private name: string;
  private bot: Botler;
  // tslint:disable-next-line:variable-name
  private _begin: DialogFunction = null;
  public button: FunctionShell & DotAlways;
  public expect: ExpectInput;
  public intent: FunctionShell & DotAlways;;

  constructor(bot: Botler, scriptName: string) {
    this.bot = bot;
    this.name = scriptName;
    this.button = this._button.bind(this);
    this.button.always = this._buttonAlways.bind(this);
    this.expect = this._expect.bind(this);
    this.expect.text = this.expectText.bind(this);
    this.expect.button = this._buttonExpect.bind(this);
    this.intent = this._intent.bind(this);
    this.intent.always = this._intentAlways.bind(this);
    return this;
  }

  public run(incoming: Incoming, outgoing: Outgoing, nextScript: () => Promise<void>, step: number = incoming.user.scriptStage) {
    const topic = incoming.intent.topic;
    const action = incoming.intent.action;

    console.log(`run step ${step}`);
    const top = _.slice(this.dialogs, 0, Math.max(0, step));
    const bottom = _.slice(this.dialogs, Math.max(0, step));

    let validDialogs: Array<DialogShell> = bottom;
    let forcedDialogs: Array<DialogShell> = top.filter((shell) => shell.force).filter((shell) => {
      switch (shell.type) {
        case 'intent':
          return this.filterDialog(topic, action)(shell);
        case 'dialog':
          return shell.force;
        case 'button':
          return shell.force;
        case 'expect':
          return false;
        default:
          throw new Error('Unknown Dialog type');
      }
    });

    console.log('Vd', validDialogs.length, 'Fd', forcedDialogs.length);

    const runUnforced = () => {
      return Promise.resolve()
        .then(() => console.log('runniong valid'))
        .then(() => this.callScript(incoming, outgoing, validDialogs, nextScript, step));
    };
    return Promise.resolve()
      .then(() => {
        if (step === -1) {
          incoming.user.scriptStage = 0;
          if (this._begin !== null) {
            console.log('running begin');
            return this._begin(incoming, outgoing, stopFunction);
          }
        }
      })
      .then(() => this.callScript(incoming, outgoing, forcedDialogs, runUnforced, 0));
  }

  public begin(dialogFunction: DialogFunction): this {
    this._begin = dialogFunction;
    return this;
  }

  public dialog(dialogFunction: DialogFunction): this;
  public dialog(name: string, dialogFunction: DialogFunction): this;
  public dialog(): this {
    let name: string = null;
    let dialogFunction: DialogFunction = arguments[0];
    if (arguments.length === 2) {
      name = arguments[0];
      dialogFunction = arguments[1];
    }
    const dialog: Dialog = {
      type: 'dialog',
      force: false,
      function: dialogFunction.bind(this),
      name: name,
      blocking: false,
    };
    this.dialogs.push(dialog);
    return this;
  }

  private _expect(type: MessageType, dialogFunction: DialogFunction): this {
    let theFunction: DialogFunction =  null;
    switch (arguments.length) {
      case 1:
        theFunction = arguments[0];
        break;
      case 2:
        type = arguments[0];
        theFunction = arguments[1];
        break;
      default:
        throw new Error('Bad function arguments');
    }

    const dialog: Expect = {
      type: 'expect',
      expect: {
        type: type,
        catch: null,
      },
      function: theFunction.bind(this),
      force: false,
      blocking: true,
    };
    this.dialogs.push(dialog);
    return this;
  }


  private expectText(dialogFunction: DialogFunction): this {
    return this._expect(MessageTypes.text, dialogFunction);
  }

  public catch(dialogFunction: DialogFunction): this {
    const lastDialog: DialogShell = _.last(this.dialogs);
    if (lastDialog.type !== 'expect') {
      throw new Error('catch must be after expect');
    }
    if (lastDialog.expect !== null) {
      lastDialog.expect.catch = dialogFunction.bind(this);
    }
    return this;
  }

  private _intent(dialogFunction: DialogFunction): this;
  private _intent(topic: string, dialogFunction: DialogFunction): this;
  private _intent(topic: string, action: string, dialogFunction: DialogFunction): this;
  private _intent(): this {
    let intent = null;
    let theFunction: DialogFunction = null;
    switch (arguments.length) {
      case 0:
        return this;

      case 1:
        theFunction = arguments[0];
        break;

      case 2:
        intent = {
          action: null,
          topic: arguments[0],
        };
        theFunction = arguments[1];
        break;

      case 3:
        intent = {
          action: arguments[1],
          topic: arguments[0],
        };
        theFunction = arguments[2];
        break;

      default:
        throw new Error('Incorect argument count');
    }

    const dialog: Intent = {
      type: 'intent',
      force: false,
      function: theFunction.bind(this),
      intent: intent,
      blocking: false,
    };
    this.dialogs.push(dialog);
    return this;
  }

  private _intentAlways() {
    this._intent.apply(this, arguments);
    _.last(this.dialogs).force = true;
    return this;
  }

  private _button(dialogFunction: DialogFunction): this;
  private _button(postback: string, dialogFunction: DialogFunction): this;
  private _button(): this {
    let buttonPayload: string = null;
    let theFunction: DialogFunction = null;
    switch (arguments.length) {
      case 1:
        buttonPayload = null;
        theFunction = arguments[0];
        break;

      case 2:
        buttonPayload = arguments[0];
        theFunction = arguments[1];
        break;

      default:
        throw new Error('bad arguments');
    }

    const dialog: Button = {
      type: 'button',
      force: false,
      function: theFunction.bind(this),
      button: buttonPayload,
      blocking: false,
    };
    this.dialogs.push(dialog);
    return this;
  }

  private _buttonAlways(): this {
    this._button.apply(this, arguments);
    _.last(this.dialogs).force = true;
    return this;
  }

  private _buttonExpect(dialogFunction: DialogFunction): this;
  private _buttonExpect(postback: string, dialogFunction: DialogFunction): this;
  private _buttonExpect() {
    this._button.apply(this, arguments);
    _.last(this.dialogs).blocking = true;
    return this;
  }

  private filterDialog(topic: string, action: string) {
    return (shell: DialogShell) => {
      if (shell.type !== 'intent') {
        return;
      }

      if (shell.intent === null) {
        return true;
      }
      if (shell.intent.action === null && shell.intent.topic === topic) {
        return true;
      }
      if (shell.intent.action === action && shell.intent.topic === topic) {
        return true;
      }
      return false;
    };
  }

  private callScript(request: Incoming, response: Outgoing, dialogs: Array<DialogShell>, nextScript: () => Promise<void>, thisStep: number): Promise<void> {
    if (dialogs.length === 0) {
      return nextScript();
    }

    const currentDialog = _.head(dialogs);
    const nextDialogs = _.tail(dialogs);
    const currentScript = currentDialog.function;

    console.log(`running step ${thisStep}`);

    if (currentDialog.type === 'intent' && this.filterDialog(request.intent.topic, request.intent.action)(currentDialog) === false) {
      console.log('not a valid intent, moving on');
      return Promise.resolve(this.callScript(request, response, nextDialogs, nextScript, thisStep + 1));
    }

    if (currentDialog.type === 'button') {
      if (request.message.type !== 'postback') {
        if (currentDialog.blocking === true) {
          stopFunction();
        } else {
          return Promise.resolve(this.callScript(request, response, nextDialogs, nextScript, thisStep + 1));
        }
      } else if (request.message.type === 'postback' && request.message.payload !== currentDialog.button) {
        if (currentDialog.blocking === true) {
          stopFunction();
        } else {
          return Promise.resolve(this.callScript(request, response, nextDialogs, nextScript, thisStep + 1));
        }
      }
    }

    // tslint:disable-next-line:variable-name
    const __this = this;
    return Promise.resolve()
      .then(() => {
        if (currentDialog.type === 'expect') {
          if (currentDialog.expect.type !== request.message.type) {
            console.log('expect type mismatch');
            return stopFunction(StopScriptReasons.ExpectCaught);
          }
        }
      })
      .then(() => currentScript(request, response, stopFunction))
      .then(() => {
        if (nextDialogs.length === 0) {
          throw new EndScriptException(EndScriptReasons.Reached);
        }
        // console.log('thisStep', thisStep, Math.max(request.user.scriptStage, thisStep + 1));
        request.user.scriptStage = Math.max(request.user.scriptStage, thisStep + 1);
        const dialog = _.head(nextDialogs);
        if (dialog.type === 'dialog' || dialog.type === 'intent') {
          return __this.callScript(request, response, nextDialogs, nextScript, thisStep + 1);
        }
      })
      .catch((err: Error) => {
        if (err instanceof StopException && currentDialog.type === 'expect' && currentDialog.expect !== null && currentDialog.expect.catch !== null) {
          return Promise.resolve()
            .then(() => currentDialog.expect.catch(request, response, stopFunction))
            .then(() => stopFunction(StopScriptReasons.ExpectCaught));
        }
        throw err;
      });
  }
}

export function stopFunction(reason: StopScriptReasons = StopScriptReasons.Called) {
  throw new StopException(reason);
}
