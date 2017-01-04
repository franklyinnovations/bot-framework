import { Outgoing as OutgoingInterface } from './types/bot';
import { User } from './types/user';
import * as Message from './types/message';
import { PlatformMiddleware } from './types/platform';

export default class Outgoing implements OutgoingInterface {
    protected promise: Promise<PlatformMiddleware> = Promise.resolve(null);
    protected user: User;
    constructor(user: User) {
        this.user = user;
        return this;
    }

    public startScript(name: string = '') {
        this.user.script = name;
    }

    public sendText(text: string) {
        const textMessage: Message.TextMessage = {
            type: 'text',
            text: text,
        };
        this.promise = this.promise.then(() => this.user._platform.send(this.user, textMessage));
        return this;
    }

    public createButtons(): Message.ButtonMessage {
        return new Message.ButtonMessage(this);
    }

    public sendButtons(message: Message.ButtonMessage) {
        this.promise = this.promise.then(() => this.user._platform.send(this.user, message));
        return this;
    }
}