import { Message, Text } from '../message';
export interface TextMessage extends Message {
    type: Text;
    text: string;
}
