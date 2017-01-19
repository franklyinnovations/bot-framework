import * as Promise from 'bluebird';
import * as bodyParser from 'body-parser';
import * as Express from 'express';
import FB from 'facebook-send-api';
import * as SendTypes from 'facebook-sendapi-types';
import * as http from "http";
import * as _ from 'lodash';

import Botler from '../bot';
import { mapInternalToFB } from './facebook';

import { Message, TextMessage } from '../types/message';
import { PlatformMiddleware } from '../types/platform';
import { BasicUser, User } from '../types/user';
import { State } from './web/www/redux/store';

const savedConversation: { [id: string]: Array<SendTypes.MessengerPayload> } = {};
const PAGEID = 'page';

export default class Web implements PlatformMiddleware {
  private bot: Botler;
  private localApp: Express.Express;
  private localServer: http.Server = null;
  private localPort: number;

  constructor(botler: Botler, port: number = 3000, fbport: number = 4100) {
    this.bot = botler;
    this.localPort = port;
    this.localApp = Express();
    this.localApp.use(bodyParser.json());
    this.localApp.use(Express.static(`${__dirname}/web`));
    this.localApp.post('/api/conversation', (req, res, next) => {
      const user: BasicUser = {
        id: '0',
        platform: 'web',
        _platform: this,
      };
      if (_.has(savedConversation, [`${user.platform}${user.id.toString()}`]) === false) {
        return res.send([]);
      }
      return this.getUserConversation(req.body.userid.toString())
        .then((conversation) => res.send(conversation));
    });
    this.localApp.post('/api/receive', (req, res, next) => {
      // send to bot
      const user: BasicUser = {
        id: req.body.userid,
        platform: 'web',
        _platform: this,
      };
      const message: TextMessage = {
        type: 'text',
        text: req.body.text,
      };
      const fbMessage: SendTypes.MessengerPayload = {
        recipient: {
          id: PAGEID,
        },
        message: mapInternalToFB(message)
      };

      _.update(savedConversation, [`${user.platform}${user.id.toString()}`], (n: Array<SendTypes.MessengerPayload>) => {
        return n ? n.concat(fbMessage) : [ fbMessage ];
      });

      this.bot.processMessage(user, message);
    });
    this.localApp.post('/api/start', (req, res, next) => {
      const user: BasicUser = {
        id: '0',
        platform: 'web',
        _platform: this,
      };
      if (_.has(savedConversation, [`${user.platform}${user.id.toString()}`])) {
        return this.getUserConversation(user.id)
          .then((conversation) => {
            const state: State = {
              userid: user.id,
              conversation: conversation,
              pageid: PAGEID,
            };
            res.send(state);
          });
      }
      console.log('new user');
      this.bot.processGreeting(user)
        .then(() => {
          const state: State = {
            userid: user.id,
            conversation: [],
            pageid: PAGEID,
          };
          return res.send(state);
        });
      return;
    });
  }

  public start() {
    this.localServer = this.localApp.listen(this.localPort, () => {
      if (this.bot.debugOn) {
        console.log(`Web platform listening on port ${this.localPort}`);
      }
    });
    return Promise.resolve(this);
  }

  public stop() {
    this.localServer.close(() => {
      if (this.bot.debugOn) {
        console.log('Web platform stopped');
      }
    });
    this.localServer = null;

    return Promise.resolve(this);
  }

  public send <U extends User, M extends Message>(user: U, message: M): Promise<this> {
    const fbMessage: SendTypes.MessengerPayload = {
      recipient: {
        id: user.id,
      },
      message: mapInternalToFB(message)
    };
    _.update(savedConversation, [`${user.platform}${user.id.toString()}`], (n: Array<SendTypes.MessengerPayload>) => {
      return n ? n.concat(fbMessage) : [ fbMessage ];
    });
    console.log(savedConversation);
    return Promise.resolve(this);
  }

  private getUserConversation(userId: string): Promise<Array<SendTypes.MessengerPayload>> {
    const user: BasicUser = {
      _platform: this,
      id: userId,
      platform: 'web',
    };
    let conversation: Array<SendTypes.MessengerPayload> = savedConversation[`${user.platform}${user.id.toString()}`]

    return Promise.resolve(conversation);
  }

}
