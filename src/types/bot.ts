export interface Intent {
  action: string;
  topic: string;
  details: {
    confidence: number;
  } | any;
}

export interface User {
  id: string;
  platform: string;
  conversation: Array<string>;
  state: any;
  intent: Intent;
}

export interface Session {
    user: User;
    intent: Intent
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

export declare class TextMessage {
    public text: string;
    text(): this;
    send(): Promise<this>
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