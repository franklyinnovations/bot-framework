import Facebook from './facebook';
import Botler from '../index';
import * as Express from 'express';
import * as bodyParser from 'body-parser';
import * as http from "http";
import * as Promise from 'bluebird';

export default class Web extends Facebook {
  private localApp: Express.Express;
  private localServer: http.Server = null;
  private localPort: number;

  constructor(botler: Botler, port: number = 3000, fbport: number = 4100) {
    super(botler, fbport);
    this.localPort = port;
    this.localApp = Express();
    this.localApp.use(bodyParser.json());
  }

  public start() {
    this.localServer = this.localApp.listen(this.localPort, () => {
      if (this.bot.debugOn) {
        console.log(`Web platform listening on port ${this.localPort}`);
      }
    });
    const __this = this;

    return Promise.all([
      super.start(),
    ])
      .then(() => __this);
  }

  public stop() {
    this.localServer.close(() => {
      if (this.bot.debugOn) {
        console.log('Web platform stopped');
      }
    });
    this.localServer = null;

    const __this = this;
    return Promise.all([
      super.stop(),
    ])
      .then(() => __this);
  }
}
