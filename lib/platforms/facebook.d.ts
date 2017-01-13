/// <reference types="bluebird" />
import { PlatformMiddleware } from '../types/platform';
import { Message } from '../types/bot';
import Botler from '../index';
import { User } from '../types/user';
import * as Promise from 'bluebird';
export default class Facbook implements PlatformMiddleware {
    protected bot: Botler;
    private port;
    private route;
    private expressApp;
    private server;
    private verifyToken;
    constructor(botler: Botler, port?: number, route?: string, verifyToken?: string);
    start(): Promise<this>;
    stop(): Promise<this>;
    send<U extends User, M extends Message.Message>(user: U, message: M): Promise<this>;
    private processMessage(event);
    private processPostback(user, event);
    private processText(user, event);
}
