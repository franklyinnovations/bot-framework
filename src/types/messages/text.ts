import { Message } from '../message';

export interface TextMessage extends Message {
    text: string;
}