import { UserMiddleware, User, BasicUser } from '../types/user';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import Botler from '../index';

export default class Memory implements UserMiddleware {
  private users: { [platform: string]: { [id: string]: User } } = {};
  private bot: Botler;
  constructor(bot: Botler) {
    this.bot = bot;
  }

  public getUser(user: BasicUser): Promise<User> {
    if (!_.has(this.users, [user.platform, user.id])) {
      return Promise.resolve(_.merge(this.bot.createEmptyUser(), user));
    }
    return Promise.resolve(this.users[user.platform][user.id]);
  }

  public saveUser<U extends User>(user: U): Promise<U> {
    _.set(this.users, [user.platform, user.id], user);
    return Promise.resolve(user);
  }
}
