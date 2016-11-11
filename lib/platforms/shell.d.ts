import * as Platform from '../types/platform';
export declare class BasePlatform implements Platform.Platform {
    constructor();
    start(): Promise<this>;
}
