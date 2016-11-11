export interface Platform {
    start: () => Promise<this>;
}
export interface Session {
    sendText: (text: string) => Promise<this>;
    sendImage: (url: string) => Promise<this>;
    createButtons: () => ButtonMessage;
    createCarousel: () => CarouselMessage;
    createQuickReplies: () => QuickReplies;
}
export interface _Message {
    title(title: string): this;
    text(text: string): this;
    subtitle(sutitle: string): this;
    postbackButton(text: string, postback: string): this;
    urlButton(text: string, url: string): this;
    image(url: string): this;
}
export interface Element extends _Message {
}
export interface Message extends _Message {
    send: () => Promise<any>;
}
export interface ButtonMessage extends Message {
}
export interface CarouselMessage extends Message {
    createElement(): Element;
    addElement(anElemnt: Element): this;
}
export interface QuickReplies extends Message {
}
export interface Button {
    type: string;
    title: string;
    payload?: string;
    url?: string;
}
