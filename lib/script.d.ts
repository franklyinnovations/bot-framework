/// <reference types="bluebird" />
import * as Promise from 'bluebird';
import { Incoming, DialogFunction, Outgoing } from './types/bot';
import { MessageType } from './types/message';
import Botler from './bot';
export declare enum StopScriptReasons {
    Called = 0,
    NewScript = 1,
    ExpectCaught = 2,
}
export declare class StopException extends Error {
    reason: StopScriptReasons;
    constructor(reason: StopScriptReasons);
}
export declare enum EndScriptReasons {
    Called = 0,
    Reached = 1,
}
export declare class EndScriptException extends Error {
    reason: EndScriptReasons;
    constructor(reason: EndScriptReasons);
}
export declare type FunctionAlways = {
    (...args: any[]): (...args: any[]) => this;
    always: (...args: any[]) => Script;
};
export default class Script {
    private dialogs;
    private name;
    private bot;
    private _begin;
    private nextCall;
    button: FunctionAlways;
    constructor(bot: Botler, scriptName: string);
    run(incoming: Incoming, outgoing: Outgoing, nextScript: () => Promise<void>): Promise<void>;
    addDialog(dialogFunction: DialogFunction): this;
    addDialog(name: string, dialogFunction: DialogFunction): this;
    expect(dialogFunction: DialogFunction): this;
    expect(type: MessageType, dialogFunction: DialogFunction): this;
    catch(dialogFunction: DialogFunction): this;
    match(dialogFunction: DialogFunction): this;
    match(topic: string, dialogFunction: DialogFunction): this;
    match(topic: string, action: string, dialogFunction: DialogFunction): this;
    private _button();
    private _buttonAlways();
    private always();
    readonly force: this;
    begin(dialogFunction: DialogFunction): this;
    private filterDialog(topic, action);
    private callScript(request, response, dialogs, nextScript, thisStep);
}
export declare function stopFunction(reason?: StopScriptReasons): void;
