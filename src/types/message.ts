export interface Message {
    type: string;
};

export type Text = 'text';
export type Image = 'image';

import { TextMessage } from './messages/text';
import { ImageMessage } from './messages/image';
import { ButtonMessage } from './messages/button';
import { PostbackMessage } from './messages/postback';
import { Greeting } from './messages/greeting';

export type IncomingMessage = TextMessage | PostbackMessage | Greeting | ImageMessage;
export type MessageType = Text | Image;
export const MessageTypes: {
    text: Text,
    image: Image,
} = {
    text: 'text',
    image: 'image',
};
export { TextMessage, ButtonMessage, PostbackMessage, ImageMessage, Greeting };
