import Outgoing from '../../outgoing';
import { Message } from '../message';
export declare type Button = PostbackButton | LinkButton;
export interface PostbackButton {
    type: 'postback';
    text: string;
    payload: string;
}
export interface LinkButton {
    type: 'url';
    text: string;
    url: string;
}
export declare class ButtonMessage implements Message {
    protected _text: string;
    protected _buttons: Array<Button>;
    protected _outgoing: Outgoing;
    constructor(outgoing: Outgoing);
    type: string;
    text(): string;
    text(newText: string): this;
    addButton(newButton: Button): this;
    send(): Outgoing;
}
