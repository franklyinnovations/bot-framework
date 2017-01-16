import { PlatformMiddleware } from '../types/platform';
import { Message } from '../types/bot';
import * as Bot from '../types/bot';
import { User } from '../types/user';
import * as readline from 'readline';
import * as Promise from 'bluebird';
import Botler from '../bot';

export default class Console implements PlatformMiddleware {
  private rl: readline.ReadLine;
  protected theUser: User;
  protected bot: Botler;

  constructor(bot: Botler) {
    this.bot = bot;
  }

  public start() {
    // usually start listening on a port here
    // reset user
    this.theUser = this.bot.createEmptyUser({
      id: 0,
      platform: 'console',
      _platform: this,
    });
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.bot.processGreeting(this.theUser);

    this.rl.on('line', (input: string) => {
      console.log(`<- "${input}"`);
      const message: Bot.IncomingMessage = {
        type: 'text',
        text: input,
      };
      this.bot.processMessage(this.theUser, message)
    });
    return Promise.resolve(this);
  }

  public stop() {
    this.rl.close();
    this.rl = null;
    // usually stop listening here
    return Promise.resolve(this);
  }

  public send<U extends User, M extends Message.Message>(user: U, message: M) {
    switch (message.type) {
      case 'text':
        const textMessage: Message.TextMessage = message as any;
        const text = textMessage.text;
        console.log(`-> ${text}`);
        break;

      default:
        break;
    }
    return Promise.resolve(this);
  }
}