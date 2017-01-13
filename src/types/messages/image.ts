import { Message, Image } from '../message';

export interface TextMessage extends Message {
    type: Image;
    url: string;
}