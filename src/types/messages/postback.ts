import { Message, Postback } from '../message';

export interface PostbackMessage extends Message {
  type: Postback;
  payload: string;
}
