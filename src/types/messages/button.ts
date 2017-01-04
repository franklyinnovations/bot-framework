import Outgoing from '../../outgoing';
import { Message } from '../message';

export type Button = PostbackButton | LinkButton;

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


export class ButtonMessage implements Message {
    protected _text = '';
    protected _buttons: Array<Button> = [];
    protected _outgoing: Outgoing;

    constructor(outgoing: Outgoing) {
        this._outgoing = outgoing;
        return this;
    }

    set type(newType: string) {}

    get type() {
        return 'button';
    }

    text(): string;
    text(newText: string): this;
    text(newText?: string) {
        if (typeof newText === 'undefined') {
            return this._text;
        }
        this._text = newText;
        return this;
    }

    addButton(newButton: Button): this {
        this._buttons.push(newButton);
        return this;
    }

    send(): Outgoing {
        return this._outgoing.sendButtons(this);
    }
}