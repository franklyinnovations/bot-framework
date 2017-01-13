import { Message } from '../message';
export interface Greeting extends Message {
    type: 'greeting';
}
