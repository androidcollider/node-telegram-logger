(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('https')) :
  typeof define === 'function' && define.amd ? define(['https'], factory) :
  (global.TelegramLogger = factory(global.https));
}(this, (function (https) { 'use strict';

  https = https && https.hasOwnProperty('default') ? https['default'] : https;

  const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

  const isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';

  //TODO: detect react-native
  require('dotenv').config();
  const winston = require('winston');
  const Transport = require('winston-transport');
  const util = require('util');
  const TelegramLogger = require('../dist/bundle.js');
  var URL = require('url');
  var Agent = require('socks5-https-client/lib/Agent');

 const agentOptions = {
      socksHost:  process.env.Socks5Host,
      socksPort: process.env.Socks5Port,
      socksUsername: process.env.Socks5User,
      socksPassword: process.env.Socks5Password
  } 
  const agent = new Agent(agentOptions);
  //
  // Inherit from `winston-transport` so you can take advantage
  // of the base functionality and `.exceptions.handle()`.
  //
  class telegramTransporter extends Transport {
    constructor(opts,tg) {
      super(opts);
      // console.log(opts,a,'asdasdsda')
      this.tg = tg;
      //
      // Consume any custom options here. e.g.:
      // - Connection information for databases
      // - Authentication information for APIs (e.g. loggly, papertrail, 
      //   logentries, etc.).
      //
    }

    log(info, callback) {
      this.tg.sendMessage(info.message,info.level);
      // Perform the writing to the remote service
      callback();
    }
  }

  class TelegramLogger$1 {
      constructor(token,channelName){
          this.isThereToken(token);
          this.isThereChannel(channelName);
          this.token = token; 
          this.channelName = channelName;
          this.baseUrl = `https://api.telegram.org/bot${token}/`;
          this.env = this.detectEnv();
      }
      detectEnv(){
          if(isBrowser){
              return 'browser'
          }
          if(isNode){
              return 'node'
          }
      }
      isThereToken(token){
          if(!token) throw new Error('there is no token in class constructor')
      }
      isThereChannel(channel){
          if(!channel) throw new Error('there is no channel name in class constructor')
      }
      sendRequest(url){
          let env = this.env;
          if(env == 'node')
              return this.nodeRequest(url)
          else if(env == 'browser')
              return this.browserRequest(url)
          
      }
      async browserRequest(url){
          try{
              let {data} = await fetch(url);
              return data 
          }catch(e){
              console.log(e.response.data);
          }
          
      }
      nodeRequest(url) {
          const myURL = URL.parse(url);

          const options = {
              hostname: myURL.host,
              path: myURL.path,
              rejectUnauthorized: true,
              agent: agent
          };
          
          return https.get(options, (res) => {
              const {
                  statusCode
              } = res;
              if (statusCode !== 200) {
                  let data;
                  res.on('data', (chunk) => {
                      data += chunk;
                  });
                  res.on('end', () => {
                      console.log(data);
                  });
              }
          }).on('error', (e) => {
              console.log(e, 'got an error in https request');
          });
      }
      sendMessage(message,level='RANDOM'){
          let emoji = this.emojiMap()[level];
          console.log(emoji,level);
          if(level == 'RANDOM')  {
              let emojiArray = Object.keys(this.emojiMap()).sort();
              let emojiIndex = emojiArray[this.getRandomNumber(1,5)];
              emoji = this.emojiMap()[emojiIndex];
          }
          message = `${emoji} ${message}
${this.getDate()}`;        

          let urlParams =encodeURI(`chat_id=${this.channelName}&text=${message}&parse_mode=HTML`);
          // let urlParams = querystring.stringify({
          //     chat_id : this.channelName,
          //     text : message ,
          //     parse_mode  :'HTML'
          // })
          let url =  `${this.baseUrl}sendMessage?${urlParams}`;
          this.sendRequest(url); 
      }
       emojiMap(){
          return {
              DEBUG    : '🚧',
              INFO     : '‍💬',
              NOTICE   : '🕵',
              WARNING  : '⚡️',
              ERROR    : '🚨',
              CRITICAL : '🤒',
              ALERT    : '👀',
              EMERGENCY: '🤕',
              emerg: '🤕', 
              alert: '👀', 
              crit:  '🤒', 
              error: '🚨', 
              warning: 4, 
              notice:  '🕵', 
              info: '‍💬', 
              debug: '🚧'
          }   
      }
      getDate(){
          let date = new Date();
          let hours = date.getHours();
          let minutes = date.getMinutes();
          let ampm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          minutes = minutes < 10 ? '0'+minutes : minutes;
          let strTime = hours + ':' + minutes + ' ' + ampm;
          return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime
      }
      getRandomNumber(min, max) {
          return Math.round(Math.random() * (max - min) + min)
        }
        setWinstonTransporter(tg){
            console.log(tg);
            return new telegramTransporter({ filename: 'error.log', level: 'info' },tg)
        }
  }

  return TelegramLogger$1;

})));
