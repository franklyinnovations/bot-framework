/// <reference types="bluebird" />
import { TopicCollection, Classifiers } from './classifier';
import { Intent } from './types/bot';
import { IncomingMessage } from './types/bot';
import { IntentGenerator } from './types/bot';
import * as Promise from 'bluebird';
export declare const defaultClassifierDirectories: Array<string>;
export default class NLPBase implements IntentGenerator {
    classifiers: Classifiers;
    private components;
    constructor(classifierFiles?: Array<string | TopicCollection>);
    getIntents(message: IncomingMessage): Promise<Array<Intent>>;
    retrainClassifiers(classifierFiles?: Array<string | TopicCollection>): void;
    getTopics(): any;
}
export declare function baseBotTextNLP(text: string): Promise<Array<Intent>>;
export declare function locationNLP(text: string): Promise<Array<Intent>>;
