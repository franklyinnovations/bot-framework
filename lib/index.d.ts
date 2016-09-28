import * as Promise from 'bluebird';
import { TopicCollection, Classifiers } from './classifier';
export { TopicCollection } from './classifier';
export interface Intent {
    action: string;
    topic: string;
    details: {
        confidence: number;
    } | any;
}
export interface User {
    conversation?: Array<string>;
    state: any;
    intent: Intent;
}
export interface IntentFunction {
    (text: string, user?: User): Promise<Intent>;
}
export interface SkillFunction {
    (user: User): Promise<User>;
}
export interface ReducerFunction {
    (intents: Array<Intent>, user?: User): Promise<Intent>;
}
export default class ChatBot {
    classifiers: Classifiers;
    private intents;
    private skills;
    private reducer;
    private debugOn;
    constructor(classifierFiles?: Array<string | TopicCollection>);
    unshiftIntent(newIntent: IntentFunction): this;
    unshiftSkill(newSkill: SkillFunction): this;
    setReducer(newReducer: ReducerFunction): this;
    turnOnDebug(): this;
    retrainClassifiers(classifierFiles?: Array<string | TopicCollection>): void;
    createEmptyIntent(): Intent;
    createEmptyUser(defaults?: any): User;
    processText<U extends User>(user: U, text: string): Promise<U>;
}
export declare function baseBotTextNLP(text: string): Promise<Array<Intent>>;
export declare function locationNLP(text: string): Promise<Array<Intent>>;
export declare function defaultReducer(intents: Array<Intent>): Promise<Intent>;
