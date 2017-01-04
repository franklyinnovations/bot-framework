export interface Message {
    type: string;
};

export { TextMessage } from './messages/text';
export { ButtonMessage } from './messages/button';