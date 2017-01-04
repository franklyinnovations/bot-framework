import { User } from './user';

export interface Intent {
  action: string;
  topic: string;
  details: {
    confidence: number;
  } | any;
}

export interface IncomingMessage {
    type: 'text' | 'image';
    text?: string;
    url?: string;
};

export interface Incoming {
    user: User;
    message: IncomingMessage;
    intent: Intent;
};

import * as Message from './message';
export { Message };

export interface Outgoing {
    sendText: (text: string) => this;
    // sendImage: (url: string) => this;
    createButtons: () => Message.ButtonMessage;
    // createCarousel: () => CarouselMessage;
    // createQuickReplies: () => QuickReplies;
}

export type NextFunction = () => Promise<void>;
export type ScriptFunction = (incoming: Incoming, response: Outgoing, next: NextFunction) => Promise<void>;
export type GreetingFunction = (user: User, response: Outgoing) => Promise<void>;

export declare class IntentGenerator {
    public getIntents: (message: IncomingMessage, user: User) => Promise<Array<Intent>>;
}

export interface SkillFunction {
  (user: User): Promise<User>;
}

export interface ReducerFunction {
  (intents: Array<Intent>, user?: User): Promise<Intent>;
}