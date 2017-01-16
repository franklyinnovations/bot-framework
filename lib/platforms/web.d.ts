/// <reference types="bluebird" />
import Facebook from './facebook';
import Botler from '../bot';
import * as Promise from 'bluebird';
export default class Web extends Facebook {
    private localApp;
    private localServer;
    private localPort;
    constructor(botler: Botler, port?: number, fbport?: number);
    start(): Promise<this>;
    stop(): Promise<this>;
}
