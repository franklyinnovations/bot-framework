import { User } from './user';

export interface Intent {
  action: string;
  topic: string;
  details: {
    confidence: number;
  } | any;
}

export interface Session {
    user: User;
    intent: Intent;
    sendText: (text: string) => Promise<this>;
    sendImage: (url: string) => Promise<this>;
    createButtons: () => ButtonMessage;
    createCarousel: () => CarouselMessage;
    createQuickReplies: () => QuickReplies;
}

export interface IncomingMessage {
    type: 'text' | 'image';
    text: string;
    url: string;
};

export interface _Message {
    title(title: string): this;
    text(text: string): this;
    subtitle(sutitle: string): this;
    postbackButton(text: string, postback: string): this;
    urlButton(text: string, url: string): this;
    image(url: string): this;
}

export type NextFunction = () => void;
export type ScriptFunction = (user: User, incoming: IncomingMessage, next: NextFunction) => void;

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

export interface IntentFunction {
  (text: string, user?: User): Promise<Intent>;
}

export interface SkillFunction {
  (user: User): Promise<User>;
}

export interface ReducerFunction {
  (intents: Array<Intent>, user?: User): Promise<Intent>;
}