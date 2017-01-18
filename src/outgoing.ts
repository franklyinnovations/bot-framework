import { Outgoing as OutgoingInterface } from './types/bot';
import { User } from './types/user';
import * as Message from './types/message';
import { PlatformMiddleware } from './types/platform';
import * as Promise from 'bluebird';
import Botler from './bot';
import * as _ from 'lodash';
import { stopFunction, EndScriptException, EndScriptReasons, StopScriptReasons } from './script';

export default class Outgoing implements OutgoingInterface {
  public promise: Promise<PlatformMiddleware> = Promise.resolve(null);
  protected user: User;
  protected bot: Botler;
  constructor(bot: Botler, user: User) {
    this.bot = bot;
    this.user = user;
    this.promise
    return this;
  }

  public startScript(name: string = '', scriptArguments: any = {}) {
    this.user.script = name;
    this.user.scriptStage = -1;
    this.user.scriptArguments = scriptArguments;
    stopFunction(StopScriptReasons.NewScript);
  }

  public endScript() {
    throw new EndScriptException(EndScriptReasons.Called);
  }

  public startTyping() {
      throw new Error('not implemented');
  }

  public endTyping() {
      throw new Error('not implemented');
  }

  public sendText(text: string) {
    const textMessage: Message.TextMessage = {
      type: 'text',
      text: text,
    };
    this.promise = this.promise.then(() => this.user._platform.send(this.user, textMessage)).catch((err: Error) => {
      console.log('err in ourgoing');
    })
    return this;
  }

  public createButtons(): Message.ButtonMessage {
    return new Message.ButtonMessage(this);
  }

  public sendButtons(message: Message.ButtonMessage) {
    this.promise = this.promise.then(() => this.user._platform.send(this.user, message));
    return this;
  }
}
