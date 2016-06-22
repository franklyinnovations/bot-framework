import { Intent } from './index';
export interface Topics {
    people: Array<any>;
    places: Array<any>;
}
export declare function grabTopics(text: string): Promise<Intent>;
