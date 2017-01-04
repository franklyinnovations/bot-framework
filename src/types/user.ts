import * as Bot from './bot';
import { PlatformMiddleware } from './platform';

export interface User {
  id: string;
  platform: string;
  conversation: Array<Bot.IncomingMessage>;
  state: any;
  script: string;
  _platform: PlatformMiddleware;
}

// Storage middlwware
export declare class UserMiddleware {
  public getUser?: <U extends User>(user: U) => Promise<U>;
  public saveUser?: <U extends User>(user:U) => Promise<U>;
};