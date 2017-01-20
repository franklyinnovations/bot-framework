import Outgoing from '../../outgoing';
import { Message, MessageType } from '../message';
export declare type Button = PostbackButton | LinkButton;
export declare type PostbackType = 'postback';
export declare type LinkType = 'url';
export declare type ButtonType = PostbackType | LinkType;
export interface PostbackButton {
    type: PostbackType;
    text: string;
    payload: string;
}
export interface LinkButton {
    type: LinkType;
    text: string;
    url: string;
}
export declare class ButtonMessage implements Message {
    _text: string;
    protected _buttons: Array<Button>;
    protected _outgoing: Outgoing;
    constructor(outgoing: Outgoing);
    type: MessageType;
    text(): string;
    text(newText: string): this;
    readonly buttons: Array<Button>;
    addButton(ewButton: Button): this;
    addButton(type: PostbackType, text: string, payload: string): this;
    addButton(type: LinkType, text: string, url: string): this;
    send(): Outgoing;
}
