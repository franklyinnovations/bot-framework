/// <reference types="bluebird" />
import * as Promise from 'bluebird';
import { TopicCollection } from './classifier';
import { PlatformMiddleware } from './types/platform';
import { Intent, IncomingMessage, IntentGenerator, ReducerFunction, ScriptFunction, GreetingFunction } from './types/bot';
import { UserMiddleware, User } from './types/user';
export { TopicCollection } from './classifier';
export { Intent, PlatformMiddleware };
import * as Platforms from './platforms';
export { Platforms };
export declare const defaultClassifierDirectories: Array<string>;
export default class Botler {
    private intents;
    private reducer;
    private debugOn;
    private userMiddleware;
    private platforms;
    private scripts;
    private greetingScript;
    constructor(classifierFiles?: Array<string | TopicCollection>);
    addIntent(newIntent: IntentGenerator): this;
    unshiftIntent(newIntent: IntentGenerator): this;
    _addScript(topic: string, action: string, script: ScriptFunction): this;
    addScript(): this;
    addGreeting(script: GreetingFunction): this;
    setReducer(newReducer: ReducerFunction): this;
    setUserMiddlware(middleware: UserMiddleware): this;
    addPlatform(platform: PlatformMiddleware): this;
    turnOnDebug(): this;
    getUser(): this;
    createEmptyIntent(): Intent;
    createEmptyUser(defaults?: any): User;
    start(): void;
    stop(): void;
    processGreeting<U extends User>(user: U): void;
    processMessage<U extends User>(user: U, message: IncomingMessage): Promise<void>;
    private getIntents(user, message);
    private callScript(request, scripts);
}
