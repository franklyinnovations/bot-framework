import * as Bot from './bot';
export declare class Middleware {
    constructor(Botler: any);
    start?: () => Promise<this>;
    stop?: () => Promise<this>;
    send?: <U extends Bot.User>(user: U, message: Bot.Message) => Promise<this>;
    getUser?: <U extends Bot.User>(user: U) => Promise<U>;
    saveUser?: <U extends Bot.User>(user: U) => Promise<U>;
}
