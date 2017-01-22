import { Message, Image } from '../message';

export interface ImageMessage extends Message {
    type: Image;
    url: string;
}
