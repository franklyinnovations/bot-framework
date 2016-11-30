import * as Bot from './bot';
import { User } from './user';
// Platform middlware
export declare class PlatformMiddleware {
    public start?: () => Promise<this>;
    public stop?: () => Promise<this>;
    public send?: <U extends User>(user: U, message: Bot.Message) => Promise<this>;
}
