export interface Message {
    type: MessageType;
};

export type Text = 'text';
export type Image = 'image';
export type Button = 'button';
export type Greeting = 'greeting';
export type Postback = 'postback';

import { TextMessage } from './messages/text';
import { ImageMessage } from './messages/image';
import { ButtonMessage } from './messages/button';
import { PostbackMessage } from './messages/postback';
import { GreetingMessage } from './messages/greeting';

export type IncomingMessage = TextMessage | PostbackMessage | GreetingMessage | ImageMessage;
export type MessageType = Text | Image | Button | Greeting | Postback;
export const MessageTypes: {
    text: Text;
    image: Image;
    button: Button;
    greeting: Greeting;
    postback: Postback;
} = {
    text: 'text',
    image: 'image',
    button: 'button',
    greeting: 'greeting',
    postback: 'postback',
};
export { TextMessage, ButtonMessage, PostbackMessage, ImageMessage, GreetingMessage };
