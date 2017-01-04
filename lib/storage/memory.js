"use strict";
const users = {};
class Memory {
    getUser(user) {
        return Promise.resolve(users[user.id]);
    }
    saveUser(user) {
        users[user.id] = user;
        return Promise.resolve(user);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Memory;
