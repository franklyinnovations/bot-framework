import * as Bot from './bot';
import { PlatformMiddleware } from './platform';
export interface User {
    id: string;
    platform: string;
    conversation: Array<Bot.IncomingMessage>;
    state: any;
    _platform: PlatformMiddleware;
}
export declare class UserMiddleware {
    getUser?: <U extends User>(user: U) => Promise<U>;
    saveUser?: <U extends User>(user: U) => Promise<U>;
}
