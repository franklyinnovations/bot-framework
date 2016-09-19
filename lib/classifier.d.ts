import * as natural from 'natural';
export interface ActionCollection {
    action: string;
    phrases: Array<string>;
}
export interface TopicCollection {
    topic: string;
    actions: Array<ActionCollection>;
    location: string;
}
export interface ActionClassifier {
    [key: string]: natural.LogisticRegressionClassifier;
}
export interface Classifiers {
    [key: string]: ActionClassifier;
}
export interface Classification {
    label: string;
    topic: string;
    value: number;
}
export declare const classifier: typeof natural.LogisticRegressionClassifier;
export declare function GenerateClassifier(topicsToLoad: Array<string | TopicCollection>): Classifiers;
export declare function GenerateTopicClassifier(topic: TopicCollection, allPhrases: Array<string>): {
    [key: string]: natural.LogisticRegressionClassifier;
};
export declare function checkUsingClassifier(text: string, classifier: any, label: string, topic: string): Classification;
export declare function runThroughClassifiers(text: string, classifiers: Classifiers, dump?: Boolean): Classification[];
