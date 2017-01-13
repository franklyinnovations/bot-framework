/// <reference types="bluebird" />
import { User } from './user';
import * as Promise from 'bluebird';
import { IncomingMessage } from './message';
export interface Intent {
    action: string;
    topic: string;
    details: {
        confidence: number;
    } | any;
}
export { IncomingMessage };
export interface Incoming {
    user: User;
    message: IncomingMessage;
    intent: Intent;
}
import * as Message from './message';
export { Message };
export interface Outgoing {
    sendText: (text: string) => this;
    createButtons: () => Message.ButtonMessage;
}
export declare type StopFunction = () => void;
export declare type DialogFunction = (incoming: Incoming, response: Outgoing, stop: StopFunction) => Promise<void>;
export declare type GreetingFunction = (user: User, response: Outgoing) => Promise<void>;
export declare class IntentGenerator {
    getIntents: (message: IncomingMessage, user: User) => Promise<Array<Intent>>;
}
export interface SkillFunction {
    (user: User): Promise<User>;
}
export interface ReducerFunction {
    (intents: Array<Intent>, user?: User): Promise<Intent>;
}
