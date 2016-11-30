import { UserMiddleware, User } from '../types/user';
import Botler from '../index';

const users = {};

export default class Memory implements UserMiddleware {
  public getUser<U extends User>(user: U) {
    return Promise.resolve(users[user.id]);
  }

  public saveUser<U extends User>(user: U) {
    users[user.id] = user;
    return Promise.resolve(user);
  }
}
