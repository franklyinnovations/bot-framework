import { Greeting, Message } from '../message';
export interface GreetingMessage extends Message {
    type: Greeting;
}
