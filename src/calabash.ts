import  Koa from 'koa';
import { Loader } from './loader';
// import logger from './logger';
import { Controller } from './core/controller';
import { Service } from './core/service';
import * as req from 'request';
import { deco, decorator } from './decorator';


export interface KV {
  [key: string]: any
}

export class Calabash extends Koa {
  private loader: Loader;
  private port: number;
  private ip: string;

  static Controller: typeof Controller = Controller;
  static Service: typeof Service = Service;
  static decorator: decorator = deco;
  
  config: any = {};

  constructor() {
    super();
    this.loader = new Loader(this);
    this.port = 3000;
    this.ip = '127.0.0.1';
  }

  loadDefaultMiddleware() {
    const bodyParser = require('koa-bodyparser');
    this.use(bodyParser());
  }
  error() {
    this.use(async (ctx, next) => {
      try {
        await next();
        if (ctx.status === 404) {
          ctx.body = `<h1>404 not found</h1>`;
          ctx.set('Content-Type', 'text/html');
        }
      } catch (e) {
        let status = e.status || 500;
        let message = e.message || '服务器错误';


        var err = `
                <h3>${status}</h3>
                <h3>${message}</h3>
                `
        e.stack.split('\n').forEach((stk: string, index: number) => {
          if (index !== 0) err = err + `<p>${stk}</p>`;
        })

        ctx.body = err;
        ctx.set('Content-Type', 'text/html');
      }
    })
  }

  runInDev(handler: Function) {
    if (process.env.NODE_ENV !== 'production') {
      handler.bind(this)();
    }
  }



  run(fn: (port: number, ip: string) => void, port?: number, ip?: string) {
    this.runInDev(this.error);
    this.loadDefaultMiddleware();

    this.loader.loadFlow();
    return this.listen(port || this.port, ip || this.ip, () => {
      fn && fn(port || this.port, ip || this.ip)
    })
  }

  async curl(url: string) {
    const c = new Promise((resolve, reject) => {
      req.get(url, undefined, (error: any, response: any, body: any) => {
        if (error) {
          reject(error)
        } else {
          resolve({ error, response, body });
        }
      })
    })
    return await c
  }

  async post(url: string, json: object) {
    const c = new Promise((resolve, reject) => {
      req.post(url, { body: JSON.stringify(json) }, (error: any, response: any, body: any) => {
        if (error) {
          reject(error)
        } else {
          resolve({ error, response, body });
        }
      })
    })
    return await c
  }
}