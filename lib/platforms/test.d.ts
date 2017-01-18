/// <reference types="bluebird" />
import * as Promise from 'bluebird';
import { PlatformMiddleware } from '../types/platform';
import { IncomingMessage, Message } from '../types/message';
import { User } from '../types/user';
import Tester from '../test';
import Botler from '../bot';
export default class TestPlatform implements PlatformMiddleware {
    testers: {
        [key: string]: Tester;
    };
    private bot;
    constructor(bot: Botler);
    start(): Promise<this>;
    stop(): Promise<this>;
    send<U extends User, M extends Message>(user: U, message: M): Promise<this>;
    receive(userId: string, message: IncomingMessage): Promise<void>;
    newTest(userId?: string): Tester;
}
