import Outgoing from '../../outgoing';
import { Message } from '../message';

  // tslint:disable:variable-name

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

  public text(): string;
  public text(newText: string): this;
  public text(newText?: string): this | string {
    if (typeof newText === 'undefined') {
      return this._text;
    }
    this._text = newText;
    return this;
  }

  public addButton(newButton: Button): this {
    this._buttons.push(newButton);
    return this;
  }

  public send(): Outgoing {
    return this._outgoing.sendButtons(this);
  }
}
