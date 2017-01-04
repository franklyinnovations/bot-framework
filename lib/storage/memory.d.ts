import { UserMiddleware, User } from '../types/user';
export default class Memory implements UserMiddleware {
    getUser<U extends User>(user: U): Promise<any>;
    saveUser<U extends User>(user: U): Promise<U>;
}
