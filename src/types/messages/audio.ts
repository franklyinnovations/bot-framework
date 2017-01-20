import { Message, Audio } from '../message';

export interface AudioMessage extends Message {
    type: Audio;
    url: string;
}