import Outgoing from '../../outgoing';
import { Message, MessageType, MessageTypes } from '../message';

  // tslint:disable:variable-name

export type Button = PostbackButton | LinkButton;

export type PostbackType = 'postback';
export type LinkType = 'url';
export type ButtonType = PostbackType | LinkType;

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

export class ButtonMessage implements Message {
  public _text = '';
  protected _buttons: Array<Button> = [];
  protected _outgoing: Outgoing;

  constructor(outgoing: Outgoing) {
    this._outgoing = outgoing;
    return this;
  }

  set type(newType: MessageType) {
    return;
  }

  get type(): MessageType {
    return MessageTypes.button;
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

  get buttons(): Array<Button> {
    return this._buttons;
  }

  public addButton(ewButton: Button): this;
  public addButton(type: PostbackType, text: string, payload: string): this;
  public addButton(type: LinkType, text: string, url: string): this;
  public addButton(): this {
    switch (arguments.length) {
      case 1:
        this._buttons.push(arguments[0]);
        break;
      case 3:
        switch (arguments[0]) {
          case'postback': {
            const button: PostbackButton = {
              type: 'postback',
              text: arguments[1],
              payload: arguments[2],
            };
            this._buttons.push(button);
            break;
          }

          case 'url': {
            const button: LinkButton = {
              type: 'url',
              text: arguments[1],
              url: arguments[2],
            };
            this._buttons.push(button);
            break;
          }

          default:
            throw new Error('bad type of button');
        }
        break;

      default:
        throw new Error('bad number of arguments');
    }
    return this;
  }

  public send(): Outgoing {
    return this._outgoing.sendButtons(this);
  }
}
