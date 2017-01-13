/// <reference types="bluebird" />
import { Message } from './message';
import { User } from './user';
import * as Promise from 'bluebird';
export declare class PlatformMiddleware {
    start?: () => Promise<this>;
    stop?: () => Promise<this>;
    send?: <U extends User, M extends Message>(user: U, message: M) => Promise<this>;
}
