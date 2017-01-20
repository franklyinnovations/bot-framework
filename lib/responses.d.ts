import * as messages from './types/message';
import { Button } from './types/messages/button';
export declare class ValidationException extends Error {
    constructor();
}
export declare class Response {
    check<M extends messages.Message>(message: M): void;
    type: messages.MessageType;
}
export declare class TextResponse extends Response {
    protected allowedPhrases: Array<string>;
    constructor(allowedPhrases: Array<string> | string);
    check(message: messages.TextMessage): void;
}
export declare class ImageResponse extends Response {
    protected url: string;
    constructor(url: string);
    check(message: messages.ImageMessage): void;
}
export declare class AudioResponse extends ImageResponse {
    constructor(url: string);
}
export declare class ButtonTemplateResponse extends Response {
    protected allowedText: Array<string>;
    protected buttons: Array<Button>;
    constructor(allowedText?: Array<string>, buttonArray?: Array<Button>);
    check(message: messages.ButtonMessage): void;
}
