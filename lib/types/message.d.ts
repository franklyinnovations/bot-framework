export interface Message {
    type: string;
}
export declare type Text = 'text';
export declare type Image = 'image';
import { TextMessage } from './messages/text';
import { ImageMessage } from './messages/image';
import { ButtonMessage } from './messages/button';
import { PostbackMessage } from './messages/postback';
import { Greeting } from './messages/greeting';
export declare type IncomingMessage = TextMessage | PostbackMessage | Greeting | ImageMessage;
export declare type MessageType = Text | Image;
export declare const MessageTypes: {
    text: Text;
    image: Image;
};
export { TextMessage, ButtonMessage, PostbackMessage, ImageMessage, Greeting };
