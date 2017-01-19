/// <reference types="bluebird" />
import * as Promise from 'bluebird';
import { Message } from './message';
import { User } from './user';
export declare class PlatformMiddleware {
    start: () => Promise<this>;
    stop: () => Promise<this>;
    send: <U extends User, M extends Message>(user: U, message: M) => Promise<this>;
}
