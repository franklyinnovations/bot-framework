export interface Message {
    type: MessageType;
};

export type Text = 'text';
export type Image = 'image';
export type Button = 'button';
export type Greeting = 'greeting';
export type Postback = 'postback';
export type Audio = 'audio';

import { TextMessage } from './messages/text';
import { ImageMessage } from './messages/image';
import { ButtonMessage } from './messages/button';
import { PostbackMessage } from './messages/postback';
import { GreetingMessage } from './messages/greeting';
import { AudioMessage } from './messages/audio';

export type IncomingMessage = TextMessage | PostbackMessage | GreetingMessage | ImageMessage;
export type MessageType = Text | Image | Button | Greeting | Postback | Audio;
export const MessageTypes: {
    text: Text;
    image: Image;
    button: Button;
    greeting: Greeting;
    postback: Postback;
    audio: Audio
} = {
    text: 'text',
    image: 'image',
    button: 'button',
    greeting: 'greeting',
    postback: 'postback',
    audio: 'audio',
};
export { TextMessage, ButtonMessage, PostbackMessage, ImageMessage, GreetingMessage, AudioMessage };
