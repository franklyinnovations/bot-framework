import { PlatformMiddleware } from '../types/platform';
import { Message } from '../types/bot';
import * as Bot from '../types/bot';
import Botler from '../index';
import { User } from '../types/user';
import * as Promise from 'bluebird';
import * as Express from 'express';
import * as bodyParser from 'body-parser';
import * as http from "http";
import FacebookAPI from 'facebook-send-api';
import * as FacebookTypes from 'facebook-sendapi-types';
import * as Messages from '../types/message';
import * as _ from 'lodash';
import { BasicUser } from '../types/user';

interface WebhookCallback {
  object: 'page';
  entry: Array<{
    id: string;
    time: number;
    messaging: Array<Event>;
  }>;
}

export default class Facbook implements PlatformMiddleware {
  protected bot: Botler;
  private port: number;
  private route: string;
  private expressApp: Express.Express;
  private server: http.Server = null;
  private verifyToken: string;

  constructor(botler: Botler, port: number = 3000, route: string = '/webhook', verifyToken: string = 'botler') {
    this.bot = botler;
    this.port = port;
    this.route = route;
    this.verifyToken = verifyToken;
    this.expressApp = Express();
    this.expressApp.use(bodyParser.json());
    this.expressApp.get(this.route, (req, res, next) => {
      if (req.query['hub.verify_token'] === this.verifyToken) {
        return res.send(req.query['hub.challenge']);
      }
      return res.send('Error, wrong validation token');
    });
    this.expressApp.post(this.route, (req, res, next) => {
      const wenhookCallback: FacebookTypes.WebhookCallback = req.body;
      const messagingEvents = _.flatten(wenhookCallback.entry.map(entry => entry.messaging));
      for (let i = 0; i < messagingEvents.length; i++) {
        const event = messagingEvents[i];
        this.processMessage(event);
      }
    });
  }

  public start() {
    this.server = this.expressApp.listen(this.port, () => {
      if (this.bot.debugOn) {
        console.log(`Facebook platform listening on port ${this.port}`);
      }
    });
    return Promise.resolve(this);
  }

  public stop() {
    this.server.close(() => {
      if (this.bot.debugOn) {
        console.log('Facebook platform stopped');
      }
    });
    this.server = null;
    return Promise.resolve(this);
  }

  public send<U extends User, M extends Message.Message>(user: U, message: M) {
    switch (message.type) {
      case 'text':
        const textMessage: Message.TextMessage = message as any;
        const text = textMessage.text;
        console.log(`-> ${text}`);
        break;

      default:
        break;
    }
    return Promise.resolve(this);
  }

  private processMessage(event: FacebookTypes.WebhookPayload) {
    if (event.message && event.message.is_echo) {
      return;
    }

    if (event.delivery) {
      return;
    }

    if (event.read) {
      return;
    }

    const user: BasicUser = {
      _platform: this,
      id: event.sender.id,
      platform: 'Facebook',
    };
    if (event.message && event.message.quick_reply) {
      this.processPostback(user, event);
    }

    if (event.message && event.message.text) {
      this.processText(user, event);
    }

    // if (event.message && event.message.attachment.type === "image") {

    // }

    if (event.postback) {
      this.processPostback(user, event);
    }
  }

  private processPostback(user: BasicUser, event: FacebookTypes.WebhookPayload) {
    const message: Message.PostbackMessage = {
      payload: event.postback.payload,
      type: 'postback',
    };
    this.bot.processMessage(user, message);
  }

  private processText(user: BasicUser, event: FacebookTypes.WebhookPayload) {
    const message: Message.TextMessage = {
      text: event.message.text,
      type: 'text',
    };
    this.bot.processMessage(user, message);
  }
}
