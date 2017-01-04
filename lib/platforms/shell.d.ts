import { PlatformMiddleware } from '../types/platform';
import { Message } from '../types/bot';
import { User } from '../types/user';
import Botler from '../index';
export default class Console implements PlatformMiddleware {
    private rl;
    protected bot: Botler;
    protected theUser: User;
    constructor(botler: Botler);
    start(): Promise<this>;
    stop(): Promise<this>;
    send<M extends Message.Message>(message: M): Promise<this>;
}
