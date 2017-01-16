/// <reference types="bluebird" />
import { UserMiddleware, User, BasicUser } from '../types/user';
import * as Promise from 'bluebird';
import Botler from '../bot';
export default class Memory implements UserMiddleware {
    private users;
    private bot;
    constructor(bot: Botler);
    getUser(user: BasicUser): Promise<User>;
    saveUser<U extends User>(user: U): Promise<U>;
}
