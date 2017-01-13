/// <reference types="bluebird" />
import { Incoming, DialogFunction } from './types/bot';
import { MessageType } from './types/message';
import * as Promise from 'bluebird';
import Botler from './index';
export default class Script {
    private dialogs;
    private name;
    private bot;
    constructor(bot: Botler, scriptName: string);
    run(incoming: Incoming, nextScript: () => Promise<void>, scriptData?: any): Promise<void>;
    addDialog(dialogFunction: DialogFunction): this;
    addDialog(name: string, dialogFunction: DialogFunction): this;
    expect(dialogFunction: DialogFunction): this;
    expect(type: MessageType, dialogFunction: DialogFunction): this;
    catch(dialogFunction: DialogFunction): this;
    match(dialogFunction: DialogFunction): this;
    match(topic: string, dialogFunction: DialogFunction): this;
    match(topic: string, action: string, dialogFunction: DialogFunction): this;
    readonly force: this;
    private filterDialog(topic, action);
    private callScript(request, response, dialogs, nextScript, thisStep);
}
