import * as Bot from './types/bot';
export declare type DialogFunction = (conversation: any, next: () => Promise<void>) => Promise<void>;
export interface ScriptState {
    step: number;
}
export default class Script {
    private name;
    private dialogs;
    constructor(scriptName: string);
    dialog(dialogFunction: DialogFunction): this;
    run(session: Bot.Session): any;
    private runDialog(session, dialogs);
}
