import Botler from '../index';
import * as Bot from './bot';

export interface User {
  id: string;
  platform: string;
  conversation: Array<Bot.IncomingMessage>;
  state: any;
  intent: Bot.Intent;
}

// Storage middlwware
export declare class UserMiddleware {
  public getUser?: <U extends User>(user: U) => Promise<U>;
  public saveUser?: <U extends User>(user:U) => Promise<U>;
};