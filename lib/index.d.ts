export interface Intent {
    action: string;
    topic: string;
    details?: any;
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
export interface Reducer {
    (intents: Array<Intent>, user: User): Promise<Intent>;
}
export default class ChatBot {
    private intents;
    private skills;
    private reducer;
    private debugOn;
    classifiers: any;
    constructor(classifierFiles?: Array<string>);
    unshiftIntent(newIntent: IntentFunction): this;
    unshiftSkill(newSkill: SkillFunction): this;
    setReducer(newReducer: Reducer): this;
    turnOnDebug(): this;
    createEmptyIntent(): Intent;
    createEmptyUser(defaults?: any): User;
    processText<U extends User>(user: U, text: string): Promise<U>;
}
export declare function baseBotTextNLP(text: string): Promise<Array<Intent>>;
export declare function defaultReducer(intents: Array<Intent>): Promise<Intent>;
