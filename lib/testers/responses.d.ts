import * as messages from '../types/message';
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
