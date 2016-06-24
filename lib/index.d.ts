export interface Intent {
    action: string;
    details?: any;
}
export interface User {
    conversation?: Array<string>;
    state: string;
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
    constructor(classifierFiles?: Array<string>);
    unshiftIntent(newIntent: IntentFunction): void;
    unshiftSkill(newSkill: SkillFunction): void;
    setReducer(newReducer: Reducer): void;
    processText<U extends User>(user: U, text: string): Promise<U>;
}
export declare function baseBotTextNLP(text: string): Promise<Intent>;
export declare function defaultReducer(intents: Array<Intent>): Promise<Intent>;
