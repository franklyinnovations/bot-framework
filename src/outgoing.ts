import { Outgoing as OutgoingInterface } from './types/bot';
import { User } from './types/user';
import * as Message from './types/message';
import { PlatformMiddleware } from './types/platform';
import * as Promise from 'bluebird';
import Botler from './index';
import * as _ from 'lodash';

export default class Outgoing implements OutgoingInterface {
  protected promise: Promise<PlatformMiddleware> = Promise.resolve(null);
  protected user: User;
  protected bot: Botler;
  constructor(bot: Botler, user: User) {
    this.bot = bot;
    this.user = user;
    return this;
  }

  public startScript(name: string = '', scriptArguments: any = {}) {
    this.user.script = name;
    this.user.scriptStage = 0;
    this.bot.processMessage(this.user, _.last(this.user.conversation));
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
    this.promise = this.promise.then(() => this.user._platform.send(this.user, textMessage));
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
