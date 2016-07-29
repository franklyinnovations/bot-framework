import * as natural from 'natural';
export interface ActionCollection {
    action: string;
    phrases: Array<string>;
}
export interface TopicCollection {
    topic: string;
    actions: Array<ActionCollection>;
}
export interface ActionClassifier {
    [key: string]: natural.LogisticRegressionClassifier;
}
export interface Classifiers {
    [key: string]: ActionClassifier;
}
export declare const classifier: typeof natural.LogisticRegressionClassifier;
export declare function GenerateClassifier(topicsToLoad: Array<string | TopicCollection>): Classifiers;
export declare function GenerateTopicClassifier(topic: TopicCollection, allPhrases: Array<string>): {
    [key: string]: natural.LogisticRegressionClassifier;
};
