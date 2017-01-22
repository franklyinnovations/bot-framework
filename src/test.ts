import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as util from 'util';

import * as Responses from './responses';
import { PlatformMiddleware } from './types/platform';
import { IncomingMessage, Message, TextMessage, GreetingMessage, PostbackMessage } from './types/message';
import { Button } from './types/messages/button';
import { User } from './types/user';
import { TestPlatform } from './platforms/';

const greetingMessage: GreetingMessage = {
  type: 'greeting',
};

export enum TestState {
  notStarted,
  running,
  error,
  done,
}

export default class Tester {
  private userId: string;
  private script: Array<Responses.Response | IncomingMessage> = [ greetingMessage ];
  private testPlatfom: TestPlatform;
  private step: number = 0;
  private thePromise: Promise<void> = Promise.resolve();
  private publicPromise: Promise<any>;
  private resolve: any;
  private reject: any;
  private state: TestState = TestState.notStarted;
  private timeout: number = 20;
  private timer: any;
  private checkforExtraDialogs: boolean = true;

  constructor(platform: TestPlatform, userId: string = `test-${_.random(999999)}`) {
    this.testPlatfom = platform;
    this.userId = userId;
  }

  public expectText(allowedPhrases: Array<string> | string): this {
    this.script.push(new Responses.TextResponse(allowedPhrases));
    return this;
  }

  public expectButtons(text: string, button: Array<Button>): this {
    this.script.push(new Responses.ButtonTemplateResponse([text], button));
    return this;
  }

  public sendText(text: string): this {
    const message: TextMessage = {
      type: 'text',
      text: text,
    };
    this.script.push(message);
    return this;
  }

  public sendButtonClick(payload: string): this {
    const message: PostbackMessage = {
      type: 'postback',
      payload: payload,
    };
    this.script.push(message);
    return this;
  }

  public run(): Promise<void> {
    const savedThis = this;
    this.publicPromise = new Promise(function(resolve, reject) {
      savedThis.resolve = resolve;
      savedThis.reject = reject;
    });

    this.execute();

    return this.publicPromise;
  }

  public checkForTrailingDialogs(bool: boolean): this {
    this.checkforExtraDialogs = bool;
    return this;
  }

  private execute(): Promise<void> {
    let i = this.step;
    for (i; i < this.script.length; i++) {
      const nextStep = this.script[i];
      if (nextStep instanceof Responses.Response) {
        return this.thePromise;
      } else {
        this.step = this.step + 1;
        this.thePromise = this.thePromise.then(() => this.testPlatfom.receive(this.userId, nextStep));
      }
    }

    if (this.step >= this.script.length) {
      const savedThis = this;
      if (this.checkforExtraDialogs === false) {
        savedThis.resolve();
        return;
      }
      this.timer = setTimeout(function() {
        if (savedThis.state !== TestState.error) {
          savedThis.resolve();
        }
      }, this.timeout);
    }
  }

  public receive<M extends Message>(message: M): Promise<void> {
    if (this.step >= this.script.length) {
      this.state = TestState.error;
      const err = new Error(`received '${util.inspect(message)}' after script completed`);
      this.reject(err);
      return Promise.reject(err);
    }
    const currentStep = this.script[this.step];
    if (currentStep instanceof Responses.Response) {
      this.step++;
      return Promise.resolve()
        .then(() => currentStep.check(message))
        .then(() => this.execute());
    }
    return Promise.resolve();
  }

  public onError(err: Error) {
    if (this.state === TestState.error) {
      return;
    }
    if (!this.reject) {
      console.error('no reject function yet');
      throw new Error('no reject function yet');
    }
    this.state = TestState.error;
    this.reject(err);
  }
}
