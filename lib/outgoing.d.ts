import { Outgoing as OutgoingInterface } from './types/bot';
import { User } from './types/user';
import * as Message from './types/message';
import { PlatformMiddleware } from './types/platform';
export default class Outgoing implements OutgoingInterface {
    protected promise: Promise<PlatformMiddleware>;
    protected user: User;
    constructor(user: User);
    sendText(text: string): this;
    createButtons(): Message.ButtonMessage;
    sendButtons(message: Message.ButtonMessage): this;
}
