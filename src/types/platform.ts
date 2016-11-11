import Botler from '../index';
import * as Bot from './bot';

export declare class Middleware {
    constructor(Botler);
    start?: () => Promise<this>;
    stop?: () => Promise<this>;
    //Platform middlware
    send?: <U extends Bot.User>(user: U, message: Bot.Message) => Promise<this>;

    //Storage middlwware
    getUser?: <U extends Bot.User>(user: U) => Promise<U>;
    saveUser?: <U extends Bot.User>(user:U) => Promise<U>;
}
