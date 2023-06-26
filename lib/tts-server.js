const _ = require('lodash');
const http = require('http');
const musicMeta = require('music-metadata');
    
const { v4: uuidv4 } = require('uuid');
const { BL } = require('betterlogiclibrary');



class TtsServer  {
  static client;
  static DefaultCloudVoice;
  static Urls = [];
  static UrlIndex = 0;
  
  static async getUrl ({args={text, pitch, speakingRate, volumeGainDb}={}, name, voice}) {
    try {      
      // console.log('getUrl.voice');
      // console.log(voice);
      this.ip = (await args.device.homey.cloud.getLocalAddress()).split(':')[0];
      var settings =  args.device.getSettings();
      //var languageCode = settings && settings.voice && settings.voice!='default' ? settings.languagecode : this.DefaultCloudVoice && this.DefaultCloudVoice.languageCode && this.DefaultCloudVoice.languageCode.length > 0 ? [0] : 'en-GB';
      var languagecode = (voice ? voice.languagecode : null) || (this.DefaultCloudVoice && this.DefaultCloudVoice.languageCodes && Array.isArray(this.DefaultCloudVoice.languageCodes) && this.DefaultCloudVoice.languageCodes.length>0 ? this.DefaultCloudVoice.languageCodes[0] : 'en-GB');
      name = name || (voice ? voice.id : null) || this.DefaultCloudVoice.name;
      var ssmlGender = (voice ? voice.gender : null) || this.DefaultCloudVoice.ssmlGender || 'MALE';
  
      var pitch = args.pitch || settings.pitch || 0;
      var speakingRate = args.speakingRate || settings.speakingRate || 1;
      
      args.text = await BL.decode(args.text, languagecode); 

      var url = {
        id: uuidv4(),
        text : args.text, 
        voice: {name, languageCode: languagecode, ssmlGender}, 
        audioConfig : {audioEncoding:settings.audioEncoding||'MP3', pitch: pitch , speakingRate:speakingRate || 1} 
      };
      if(settings && settings.deviceprofile && settings.deviceprofile!=='undefined') url.audioConfig.effectsProfileId = [settings.deviceprofile];
      if(args.volumeGainDb && args.volumeGainDb!=0) url.audioConfig.volumeGainDb = args.volumeGainDb;
      else if(settings && settings.volumeGainDb && settings.volumeGainDb!==0) url.audioConfig.volumeGainDb = settings.volumeGainDb;
      if(settings && (settings.defaultspeak || settings.prefixpause || settings.suffixpause))  {
        let speakStart = '<speak>';
        let speakEnd = '</speak>';
        let speakStartIndex = url.text.indexOf(speakStart);
        if(speakStartIndex==-1) url.text = speakStart + url.text + speakEnd;
        speakStartIndex = url.text.indexOf(speakStart);
        let speakEndIndex = url.text.lastIndexOf(speakEnd);
        if(settings.prefixpause>0) {
          url.text = url.text.substr(0, speakStartIndex + speakStart.length) + '<break time="'+ settings.prefixpause.toString()  +'ms"/>' +  url.text.substr(speakStartIndex + speakStart.length);
          // speakStart + url.text + speakEnd;
        }
        if(settings.suffixpause>0) {
          url.text = url.text.substr(0, speakEndIndex + speakEnd.length) + '<break time="'+ settings.suffixpause.toString()  +'ms"/>' +  url.text.substr(speakEndIndex + speakEnd.length);
          // speakStart + url.text + speakEnd;
        }
      }
      //console.log('url');
      //console.log(url);
  
      var foundUrl;
      if((foundUrl = _.find(this.Urls, u=> 
          u.text==url.text 
          && u.voice.name == url.voice.name && u.voice.languageCode == url.voice.languageCode && u.voice.ssmlGender == url.voice.ssmlGender
          && u.audioConfig.audioEncoding == url.audioConfig.audioEncoding && u.audioConfig.pitch == url.audioConfig.pitch && u.audioConfig.speakingRate == url.audioConfig.speakingRate && u.audioConfig.effectsProfileId == url.audioConfig.effectsProfileId && u.audioConfig.volumeGainDb == url.audioConfig.volumeGainDb
        )) ) {
          this.Urls.sort(function(x,y){ return x == foundUrl ? -1 : y == foundUrl ? 1 : 0; });
          //console.log('this.Urls');
          //console.log(this.Urls);
          return foundUrl;
        }
      
      url.url = 'http://' +this.ip + ':47333/tts/' + url.id + (url.audioConfig.audioEncoding=='MP3' ? '.mp3' : '.wav');
      if(this.Urls.length>=this.UrlIndex) this.Urls.push(url);
      else {
        this.Urls[this.UrlIndex] = url;        
        this.Urls.sort(function(x,y){ return x == url ? -1 : y == url ? 1 : 0; });
      }
      this.UrlIndex++;
      if(this.UrlIndex>=100) this.UrlIndex = 99;
      //console.log('this.Urls');
      //console.log(this.Urls);
      
      url.binary = await TtsServer.getResponse({text : url.text, voice:url.voice, audioConfig:url.audioConfig });
      await this.setDuration(url);
  
      return url;
    } catch (error) {
      console.log('error');
      console.log(error);
    }
    
  }
  static async setDuration(url) {    
    var info = await musicMeta.parseBuffer(Buffer.from(url.binary, 'binary'), (url.audioConfig.audioEncoding=='MP3'?  'audio/mpeg' : 'audio/wav'), { duration: true });

    //.then((info) => {
      //console.log('setDuration response ' + Math.ceil(info.format.duration * 1000));
      url.duration = Math.ceil(info.format.duration * 1000);
    //});
  }
  static async getResponse({text, voice={name=null, languageCode=null, ssmlGender=null} = {}, audioConfig = {audioEncoding='MP3', pitch=null, speakingRate=null} = {} } = {}) {

    if(!voice) voice = DefaultCloudVoice;
    //console.log('getResponse');
    //console.log(voice);
    // Construct the request
    const request = {
      input: {},//text: text},
      voice: voice,//{name:name, languageCode: language, ssmlGender: gender},
      audioConfig: audioConfig //{audioEncoding: 'MP3', pitch:0, speakingRate : 1.33},
    };
    if(text.startsWith('<speak') || text.startsWith('<Say')) request.input.ssml = text;
    else request.input.text = text;
    try {
      
      const [response] = await this.client.synthesizeSpeech(request);
      try {
        
        var b = Buffer.from(response.audioContent);
        return b;
      } catch (error2) {
        console.log('error2: ' + error2);;
      }
    } catch (error1) {
      console.log('error: ' + error1);
      var note = this.homey.notifications.createNotification({excerpt : "Google Cloud responded: " + error1 });      
    }
  }
  static async getVoices() {
    
    if(!this.client) return [];
    const [result] = await this.client.listVoices({});
    const voices = result.voices;
    //console.log(_.orderBy(_.filter(voices, v=>v.name.indexOf('-Wavenet')==-1), [o=>o.name] ));
    //return _.orderBy(_.filter(voices, v=>v.name.indexOf('-Wavenet')==-1), [o=>o.name] );
    return _.orderBy(voices, [o=>o.name] );
  }

  
  static close() {
    if(this.server) this.server.close(((err) =>{
      if(!err); this.server = null;
    }).bind(this));
  }

  static init({client, homey}) {
    this.client=client;
    this.homey = homey;
    
  
    this.server = http.createServer((function (req, res) {
      //console.log('requesting: ' + req.url);
      //console.log('req.headers: ' + req.headers);
      
      if(!req.headers || !req.headers.host || req.headers.host  != this.ip + ':47333') retur();


      if (req.url.slice(0, 5) !== '/tts/') {
        return retur();
      }

      // var text, name, language;
      //var id, url;
      var requests = req.url.substr(5).split('/');
      var id = requests[0].split('.')[0];
      //console.log('id');
      //console.log(id);
      var url = _.find(this.Urls, u=>u.id==id);
      
      // for (let i = 0; i < requests.length; i++) {
      //   const element = requests[i];

      //   // if(i==requests.length-1) {
      //   //   text = unescape(requests[i]);
      //   // } else ;
      //   var _c = requests[i].split(':');
      //   switch (_c[0]) {
      //     case 'id':
      //       id =   _c[1];
      //       url = _.find(this.Urls, u=>u.id==id);
      //       break;
      //     // case 'name':
      //     //   name =   _c[1];            
      //     //   break;
      //     // case 'language':
      //     //   language =   _c[1];            
      //     //   break;
      //   }
      // }
      //if (!name && !language) name = this.DefaultCloudVoice;

      // console.log('text');
      // console.log(text);
      // console.log(name);

      if(url) {
        if(url && url.binary && !url.binary.then)
        if(url.binary) returnBinary(res,url.binary);
        else if(url.binary && url.binary) url.binary.then(x=> {getReturn(url); }) ;
        else getReturn(url);
      } else return retur();


      function getReturn() {
        TtsServer.getResponse({text : url.text, voice:url.voice, audioConfig:url.audioConfig }).then(b=>{ 
          url.binary = b;
          this.setDuration(url);
          returnBinary(res,b);
        });
      }
      function returnBinary(res, b) {
        //console.log('write response buffer');
        res.writeHead(200, {'content-type' :  (url.audioConfig.audioEncoding=='MP3'?  'audio/mpeg' : 'audio/wav')})
        res.write(b, 'binary');
        res.end(null, 'binary');
      }



      
      function retur() {
        res.writeHead(200, {
          'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({
          status: 'ok'
        }));
      }


    
      //originResponse.pipe(res)

      // var id = req.url.slice(11, 25)
      // var url = 'https://www.youtube.com/watch?v=' + id

      // https.request({
      //   hostname: 'www.youtubetransfer.com',
      //   path: '/getinfo/?url=' + encodeURIComponent(url)
      // }, function (r) {
      //   var cookies = r.headers['set-cookie']
      //   if (!cookies) {
      //     res.writeHead(500, {
      //       'Content-Type': 'application/json'
      //     })
      //     res.end(JSON.stringify({
      //       error: 'Error fetching cookies'
      //     }))
      //     return
      //   }
      //   cookies = cookies.map(function (cookie) {
      //     return cookie.split(';')[0]
      //   })

      //   var options = {
      //     agent: false,
      //     hostname: 'www.youtubetransfer.com',
      //     path: '/download/?url=' + (Buffer.from(url).toString('base64')),
      //     headers: {
      //       cookie: cookies.join('; ')
      //     }
      //   }

      //   https.request(options, function (originResponse) {
      //     res.writeHead(originResponse.statusCode, originResponse.headers)
      //     originResponse.pipe(res)
      //   })
      //     .on('error', function (err) {
      //       console.error(err)
      //     })
      //     .end()
      // })
      //   .on('error', function (err) {
      //     console.error(err)
      //   })
      //   .end()
    }).bind(this)).listen(47333);//, '127.0.0.1')
  }
}

module.exports = TtsServer;