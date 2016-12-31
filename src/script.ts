import * as Bot from './types/bot';
import * as _ from 'lodash';

export type DialogFunction = (conversation: any, next: ()=>Promise<void>) => Promise<void>;
export interface ScriptState {
  step: number;
}

export default class Script {
  private name: string;
  private dialogs: DialogFunction[] = [];
  constructor(scriptName: string) {
    this.name = scriptName;
    return this;
  }

  public dialog(dialogFunction: DialogFunction) {
    this.dialogs.push(dialogFunction);
    return this;
  }

  public run(session: Bot.Session) {
    const currentStep = session.private.conversation.scripts[this.name].step || 0;
    const dialogsLeft = this.dialogs.slice(currentStep);
    const currentDialog = _.head(dialogsLeft);
    const remainingDialogs = _.tail(dialogsLeft);
    const nextDialog = () => {
      session.private.conversation.scripts[this.name].step += 1;
      return this.run(session);
    };
    return currentDialog(session.conversation, nextDialog);
  }

  private runDialog(session: Bot.Session, dialogs)
}