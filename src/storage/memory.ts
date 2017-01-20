import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as util from 'util';

import { UserMiddleware, User, BasicUser } from '../types/user';
import Botler from '../bot';

export default class Memory implements UserMiddleware {
  private users: { [platform: string]: { [id: string]: User } } = {};
  private bot: Botler;
  constructor(bot: Botler) {
    this.bot = bot;
  }

  public getUser(user: BasicUser): Promise<User> {
    const normalizedUserId = normalized(user);
    if (!_.has(this.users, [user.platform, normalizedUserId])) {
      return Promise.reject(new Error('User does not exist'));
    }
    return Promise.resolve(this.users[user.platform][normalizedUserId]);
  }

  public saveUser<U extends User>(user: U): Promise<U> {
    _.set(this.users, [user.platform, normalized(user)], user);
    return Promise.resolve(user);
  }
}

function normalized(user: BasicUser) {
  return `${user.platform}${user.id.toString()}`;
}