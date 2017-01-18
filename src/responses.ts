import * as _ from 'lodash';
import * as messages from './types/message';

export class ValidationException extends Error {
  constructor() {
    super('validation error');
    // Set the prototype explicitly.
    (<any>Object).setPrototypeOf(this, ValidationException.prototype);
  }
}

export class Response {
    check<M extends messages.Message>(message: M): void {
      if (message.type !== this.type) {
        throw new ValidationException()
      }
    }
    public type: messages.MessageType = null;
}

export class TextResponse extends Response {
    protected allowedPhrases: Array<string>;
    constructor(allowedPhrases: Array<string> | string) {
        super();
        if (_.isArray(allowedPhrases)) {
          this.allowedPhrases  = allowedPhrases;
        } else {
          this.allowedPhrases = [ allowedPhrases ];
        }
        this.type = messages.MessageTypes.text
    }

    check(message: messages.TextMessage): void {
      const textCheck: boolean = this.allowedPhrases.length === 0 ? true : _.includes(this.allowedPhrases, message.text);
      if (textCheck === false) {
        throw new Error(`Text mismatch expected '${this.allowedPhrases}', but got '${message.text}'`);
      }
      super.check(message)
    }
}

export class ImageResponse extends Response {
    protected url: string;
    constructor(url: string) {
        super();
        this.url = url;
        this.type = messages.MessageTypes.image;
    }

    check(message: messages.ImageMessage): void {
      if (this.url === message.url) {
        throw new Error(`URL mismatch expected '${this.url}', but got '${message.url}'`);
      }
      super.check(message);
    }
}

// export class AudioResponse extends ImageResponse {
//   constructor(url: string) {
//     super(url);
//   }
//   public type: ResponseTypes = ResponseTypes.audio_attachment;
// }

// export class FileResponse extends ImageResponse {
//   constructor(url: string) {
//     super(url);
//   }
//   public type: ResponseTypes = ResponseTypes.file_attachment;
// }

// export class VideoResponse extends ImageResponse {
//   constructor(url: string) {
//     super(url);
//   }
//   public type: ResponseTypes = ResponseTypes.video_attachment;
// }

// export class QuickRepliesResponse extends TextResponse {
//     protected buttons: Array<sendTypes.Button>;
//     constructor(allowedPhraes: Array<string> = [], buttonArray: Array<sendTypes.Button> = []) {
//         super(allowedPhraes);
//         this.buttons = buttonArray;
//     }
//     public type: ResponseTypes = ResponseTypes.quick_replies;

//     check(message: messages.Message): boolean {
//         const buttonsMatch = _.intersectionWith(this.buttons, payload.message.quick_replies, _.isEqual).length >= this.buttons.length;
//         if (buttonsMatch === false) {
//           throw new Error(`button content doesn't match`);
//         }
//         return super.check(payload) && buttonsMatch;
//     }
// }

// export class ButtonTemplateResponse extends Response {
//     protected allowedText: Array<string>;
//     protected buttons: Array<sendTypes.Button>;
//     constructor(allowedText: Array<string> = [], buttonArray: Array<sendTypes.Button> = []) {
//         super();
//         this.allowedText = allowedText;
//         this.buttons = buttonArray;
//     }
//     public type: ResponseTypes = ResponseTypes.button_template;

//     check(message: messages.Message): boolean {
//         const attachment = payload.message.attachment.payload as sendTypes.ButtonPayload;
//         const textMatches = _.includes(this.allowedText, attachment.text);
//         if (textMatches === false) {
//           throw new Error(`text doesn't match expected '${this.allowedText}' but recieved '${attachment.text}'`);
//         }
//         const buttonsMatch = _.intersectionWith(this.buttons, attachment.buttons, _.isEqual).length >= this.buttons.length;
//         if (buttonsMatch === false) {
//           throw new Error(`button doesn't match`);
//         }
//         return super.check(payload) && textMatches && buttonsMatch;
//     }
// }

// export class GenericTemplateResponse extends Response {
//     protected _elementCount: number = -1;
//     constructor() {
//         super();
//     }
//     public type: ResponseTypes = ResponseTypes.generic_template;

//     elementCount(equalTo: number): this {
//         this._elementCount = equalTo;
//         return this;
//     }

//     check(message: messages.Message): boolean {
//         const attachment = payload.message.attachment.payload as sendTypes.GenericPayload;
//         const elementCount = this._elementCount === -1 ? true : this._elementCount === attachment.elements.length;
//         if (elementCount === false) {
//           throw new Error(`element's have different count expected ${this._elementCount} but received ${attachment.elements.length}`);
//         }
//         return super.check(payload) && elementCount;
//     }
// }

// export class ReceiptTemplateResponse extends Response {
//     protected _elementCount: number = -1;
//     constructor() {
//         super();
//     }
//     public type: ResponseTypes = ResponseTypes.receipt_template;

//     elementCount(equalTo: number): this {
//         this._elementCount = equalTo;
//         return this;
//     }

//     check(message: messages.Message): boolean {
//         const attachment = payload.message.attachment.payload as sendTypes.ReceiptPayload;
//         const elementCount = this._elementCount === -1 ? true : this._elementCount === attachment.elements.length;
//         if (elementCount === false) {
//           throw new Error(`element's have different count expected ${this._elementCount} but received ${attachment.elements.length}`);
//         }
//         return super.check(payload) && elementCount;
//     }
// }