import { User } from './user';
import { ScriptState } from '../script';

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
    private: PrivateBotData;
    conversation: Conversation;
}

export interface PrivateBotData {
    conversation: {
        scripts: ScriptState[];
    };
}

export interface Conversation {
    user: User;
}

export interface IncomingMessage {
    type: 'text' | 'image';
    text: string;
    url: string;
};

export interface Incoming {
    user: User;
    message: IncomingMessage;
    intent: Intent;
};

export interface OutgoingMessage {
    sendText: (text: string) => void;
}

export interface _Message {
    title(title: string): this;
    text(text: string): this | string;
    subtitle(sutitle: string): this;
    postbackButton(text: string, postback: string): this;
    urlButton(text: string, url: string): this;
    image(url: string): this;
}

export type NextFunction = () => Promise<void>;
export type ScriptFunction = (user: User, incoming: IncomingMessage, response: OutgoingMessage, next: NextFunction) => Promise<void>;
export type GreetingFunction = (user: User, response: OutgoingMessage) => Promise<void>;

export interface Element extends _Message {

}

export interface Message extends _Message {
    send: () => Promise<any>;
}

export interface TextMessage extends Message {
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

export declare class IntentGenerator {
    public getIntents: (message: IncomingMessage, user: User) => Promise<Array<Intent>>;
}

export interface SkillFunction {
  (user: User): Promise<User>;
}

export interface ReducerFunction {
  (intents: Array<Intent>, user?: User): Promise<Intent>;
}