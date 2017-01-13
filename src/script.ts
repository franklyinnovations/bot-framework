import * as _ from 'lodash';
import { Incoming, DialogFunction } from './types/bot';
import { MessageType, Text as TextMessage } from './types/message'
import OutgoingClass from './outgoing';
import * as Promise from 'bluebird';
import Botler from './index';

interface DialogShell {
  intent: {
    topic: string;
    action: string;
  };
  expect: {
    type: MessageType;
    catch: DialogFunction;
  };
  function: DialogFunction;
  force: boolean;
  name: string;
};

class StopException extends Error {
  constructor(m: string = 'Stop') {
    super(m);
    // Set the prototype explicitly.
    (<any>Object).setPrototypeOf(this, StopException.prototype);
  }
}

export default class Script {
  private dialogs: Array<DialogShell> = [];
  private name: string;
  private bot: Botler;

  constructor(bot: Botler, scriptName: string) {
    this.bot = bot;
    this.name = scriptName;
    return this;
  }

  public run(incoming: Incoming, nextScript: () => Promise<void>, scriptData: any = null) {
    const topic = incoming.intent.topic;
    const action = incoming.intent.action;

    const top = _.slice(this.dialogs, 0, incoming.user.scriptStage);
    const bottom = _.slice(this.dialogs, incoming.user.scriptStage);

    let validDialogs: Array<DialogShell> = bottom;
    let forcedDialogs: Array<DialogShell> = top.filter((shell) => shell.force).filter(this.filterDialog(topic, action));

    const response = new OutgoingClass(this.bot, incoming.user);
    const runUnforced = () => {
      return Promise.resolve()
        .then(() => this.callScript(incoming, response, validDialogs, nextScript, incoming.user.scriptStage))
        .catch((err: Error) => {
          if (err instanceof StopException) {
            return;
          }
          throw err;
        });
    };
    return Promise.resolve()
      .then(() => this.callScript(incoming, response, forcedDialogs, runUnforced, 0))
      .catch((err: Error) => {
        if (err instanceof StopException) {
          return;
        }
        throw err;
      });;
  }

  public addDialog(dialogFunction: DialogFunction): this;
  public addDialog(name: string, dialogFunction: DialogFunction): this;
  public addDialog(): this {
    let name: string = null;
    let dialogFunction: DialogFunction = arguments[0];
    if (arguments.length === 2) {
      name = arguments[0];
      dialogFunction = arguments[1];
    }
    this.dialogs.push({
      force: false,
      function: dialogFunction.bind(this),
      intent: null,
      expect: null,
      name: name,
    });
    return this;
  }

  public expect(dialogFunction: DialogFunction): this;
  public expect(type: MessageType, dialogFunction: DialogFunction): this;
  public expect(): this {
    let type: MessageType = 'text';
    let theFunction: DialogFunction =  null;
    switch(arguments.length) {
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

    const dialog: DialogShell = {
      intent: null,
      expect: {
        type: type,
        catch: null,
      },
      function: theFunction.bind(this),
      force: false,
      name: null,
    };
    this.dialogs.push(dialog);
    return this;
  }

  public catch(dialogFunction: DialogFunction): this {
    const lastDialog: DialogShell = _.last(this.dialogs);
    if (lastDialog.expect !== null) {
      lastDialog.expect.catch = dialogFunction.bind(this);
    }
    return this;
  }

  public match(dialogFunction: DialogFunction): this;
  public match(topic: string, dialogFunction: DialogFunction): this;
  public match(topic: string, action: string, dialogFunction: DialogFunction): this;
  public match(): this {
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

    // the magic
    this.dialogs.push({
      force: false,
      function: theFunction.bind(this),
      intent: intent,
      expect: null,
      name: null,
    });
    return this;
  }

  get force(): this {
    _.last(this.dialogs).force = true;
    return this;
  }

  private filterDialog(topic: string, action: string) {
    return (shell: DialogShell) => {
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

  private callScript(request: Incoming, response: OutgoingClass, dialogs: Array<DialogShell>, nextScript: () => Promise<void>, thisStep: number): Promise<void> {
    if (dialogs.length === 0) {
      return nextScript();
    }

    const currentDialog = _.head(dialogs)
    const nextDialogs = _.tail(dialogs);
    const currentScript = currentDialog.function;

    const isValid = this.filterDialog(request.intent.topic, request.intent.action);
    if (isValid(currentDialog) === false) {
      // console.log('not valid, move on');
      return Promise.resolve(this.callScript(request, response, nextDialogs, nextScript, thisStep + 1));
    }

    const __this = this;
    return Promise.resolve()
      .then(() => currentScript(request, response, stopFunction))
      .then(() => {
        // console.log('thisStep', thisStep, Math.max(request.user.scriptStage, thisStep + 1));
        request.user.scriptStage = Math.max(request.user.scriptStage, thisStep + 1);
        if (_.head(nextDialogs).expect === null) {
          return __this.callScript(request, response, nextDialogs, nextScript, thisStep + 1);
        }
      })
      .catch((err: Error) => {
        if (currentDialog.expect !== null && currentDialog.expect.catch !== null) {
          return Promise.resolve()
            .then(() => currentDialog.expect.catch(request, response, stopFunction))
            .then(() => stopFunction());
        }
        throw err;
      });
  }
}

function stopFunction() {
  throw new StopException();
}
