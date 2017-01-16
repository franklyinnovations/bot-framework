/// <reference types="bluebird" />
import * as Bot from './bot';
import { PlatformMiddleware } from './platform';
import * as Promise from 'bluebird';
import Botler from '../bot';
export interface User extends BasicUser {
    conversation: Array<Bot.IncomingMessage>;
    state: any;
    script: string;
    scriptStage: number;
    scriptArguments: any;
}
export interface BasicUser {
    id: string;
    platform: string;
    _platform: PlatformMiddleware;
}
export declare class UserMiddleware {
    getUser?: <U extends User>(user: BasicUser) => Promise<U>;
    saveUser?: <U extends User>(user: U) => Promise<U>;
    constructor(bot: Botler);
}
