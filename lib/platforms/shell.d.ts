/// <reference types="bluebird" />
import { PlatformMiddleware } from '../types/platform';
import { Message } from '../types/bot';
import { User } from '../types/user';
import * as Promise from 'bluebird';
import Botler from '../bot';
export default class Console implements PlatformMiddleware {
    private rl;
    protected theUser: User;
    protected bot: Botler;
    constructor(bot: Botler);
    start(): Promise<this>;
    stop(): Promise<this>;
    send<U extends User, M extends Message.Message>(user: U, message: M): Promise<this>;
}
