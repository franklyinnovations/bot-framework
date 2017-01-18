/// <reference types="bluebird" />
import { Outgoing as OutgoingInterface } from './types/bot';
import { User } from './types/user';
import * as Message from './types/message';
import { PlatformMiddleware } from './types/platform';
import * as Promise from 'bluebird';
import Botler from './bot';
export default class Outgoing implements OutgoingInterface {
    promise: Promise<PlatformMiddleware>;
    protected user: User;
    protected bot: Botler;
    constructor(bot: Botler, user: User);
    startScript(name?: string, scriptArguments?: any): void;
    endScript(): void;
    startTyping(): void;
    endTyping(): void;
    sendText(text: string): this;
    createButtons(): Message.ButtonMessage;
    sendButtons(message: Message.ButtonMessage): this;
}
