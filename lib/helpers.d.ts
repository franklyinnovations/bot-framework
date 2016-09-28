import * as Promise from 'bluebird';
import { Intent } from './index';
export interface Topics {
    people: Array<any>;
    places: Array<any>;
}
export declare function grabTopics(text: string): Promise<Intent>;
export declare type locationMap = {
    [s: string]: {
        [s: string]: Array<string>;
    };
};
export declare function locatonExtractor(text: string): any;
export declare function getLocationConfidence(text: string, searchLocation: string): number;
