import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as Responses from '../responses';
import { PlatformMiddleware } from '../types/platform';
import { IncomingMessage, Message } from '../types/message';
import { User, BasicUser } from '../types/user';
import Tester from '../test';
import Botler from '../bot';

export default class TestPlatform implements PlatformMiddleware {
  public testers: { [key: string]: Tester } = {};
  private bot: Botler;

  constructor(bot: Botler) {
    this.bot = bot;
    return this;
  }

  public start() {
    return Promise.resolve(this);
  }

  public stop() {
    return Promise.resolve(this);
  }

  public send <U extends User, M extends Message>(user: U, message: M): Promise<this> {
    const test = this.testers[user.id];
    return test.receive(message)
      .catch((err: Error) => {
        test.onError(err);
      })
      .then(() => this);
  }

  public receive(userId: string, message: IncomingMessage): Promise<void> {
    const user: BasicUser = {
      id: userId,
      platform: 'testing',
      _platform: this,
    };
    return this.bot.processMessage(user, message);
  }

  public newTest(userId: string = `test-${_.random(999999)}`): Tester {
    const instance = new Tester(this, userId);
    this.testers[userId] = instance;
    return instance;
  }
}
