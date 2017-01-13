import { Message } from '../message';
export interface PostbackMessage extends Message {
    type: 'postback';
    payload: string;
}
