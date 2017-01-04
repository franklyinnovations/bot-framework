import { Message } from './message';
import { User } from './user';
// Platform middlware
export declare class PlatformMiddleware {
    public start?: () => Promise<this>;
    public stop?: () => Promise<this>;
    public send?: <U extends User, M extends Message>(user: U, message: M) => Promise<this>;
}
