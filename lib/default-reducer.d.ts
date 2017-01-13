/// <reference types="bluebird" />
import { Intent } from './types/bot';
import * as Promise from 'bluebird';
export default function defaultReducer(intents: Array<Intent>): Promise<Intent>;
