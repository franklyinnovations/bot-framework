import * as Platform from '../types/platform';
import * as Bot from '../types/bot';
import Botler from '../index';
export declare class Console implements Platform.Middleware {
    private rl;
    protected bot: Botler;
    constructor(botler: Botler);
    start(): Promise<this>;
    stop(): Promise<this>;
    send(message: Bot.Message): Promise<this>;
}
