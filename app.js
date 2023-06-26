'use strict';
const _ = require('lodash');
const Homey = require('homey');
const googleTTS = require('google-tts-api');
const textToSpeech = require('@google-cloud/text-to-speech');
    
const {Defer} = require('./lib/proto');

var TtsServer = require('./lib/tts-server');

const { BL } = require('betterlogiclibrary');

//const fetch = require('node-fetch');

//const path = require('path');

//const GoogleFunctions = require('./lib/googleFunction');


class GoogleServicesApp extends Homey.App {
  Triggers ={
    urlTrigger:{List:[], Card:null},
    cloudurlTrigger:{List:[], Card:null},
    finished_trigger:{List:[], Card:null}
  };

  async onInit() {
    
    let loadingErrors = [];
    try {
      this.log('GoogleServicesApp has been initialized');
      if (process.env.DEBUG === '1' || false) {
        try {
          require('inspector').waitForDebugger();
        }
        catch (error) {
          require('inspector').open(9217, '0.0.0.0', true);
        }
      } 

      this.log('GoogleServicesApp has been initialized part 2');

      //let bl = 
      await BL.init({homey:this.homey});

      this.log('GoogleServicesApp has been initialized part 3');

      // if(!await this.homey.settings.get('dc_avd_templates_info')) {
      //   this.homey.notifications.createNotification({excerpt : "Check out the App **Device Capabilities**:\n* A new Advanced Virtual Device with custom icons for devices and **capabilities/fields**.\n* **Share Your Device** which is than shown as a Template to others!\n* **The Flow Exchange(r)** - Export Your Flows with Others!\n* Import Templates of flows and reconfigure them for your devices, zones, tags, users, etc. before the flow(script) is created!" });  
      //   this.homey.settings.set('dc_avd_templates_info', true);
      // }
      
      this.homey.settings.on('set', (function(settingName) {
        if(settingName=='CloudJSON') {
            this.setCloudJSON();
        } else if(settingName=='DefaultCloudVoice') {
            this.setDefaultCloudVoice();
        // } else if(settingName=='DefaultCloudLanguageCode') {
        //   this.setDefaultCloudLanguageCode();
        }
      }).bind(this));
      await this.setCloudJSON();
      await this.setDefaultCloudVoice();   
      //await this.setDefaultCloudLanguageCode();

      TtsServer.init({client: this.client, homey: Homey});




      const url_trigger = this.homey.flow.getDeviceTriggerCard('url_trigger');
      this.Triggers.urlTrigger.Card = url_trigger;
      url_trigger
      .registerRunListener( async ( args, state ) => {  //console.log('url_trigger.registerRunListener'); console.log(args); 
        return true; });
      
      const cloudurl_trigger = this.homey.flow.getDeviceTriggerCard('cloudurl_trigger');
      this.Triggers.cloudurlTrigger.Card = cloudurl_trigger;
      cloudurl_trigger
      .registerRunListener( async ( args, state ) => { //console.log('cloudurl_trigger.registerRunListener'); console.log(args);
        return true; });
      

      var starts = [
        {id:'start_googletts', slow:false},
        {id:'start_googletts_slow', slow:true},        
        {id:'start_googletts_af', slow:false, af:true},
        {id:'start_googletts_slow_af', slow:true, af:true}
      ];
      for (let i = 0; i < starts.length; i++) {
        const start = starts[i];        
        const start_googlettsAction = this.homey.flow.getActionCard(start.id);
        start_googlettsAction.registerRunListener(async ( args, state ) => { //async              
          //const defer = new Defer();
          try {
            if(!args.device || !args.text) return false;
            if(args.text.length>200) return  new Error("Max 200 characters");
            const settings =  args.device.getSettings();
            const languagecode = settings && settings.languagecode ? settings.languagecode : 'en-GB';
            
            args.text = await BL.decode(args.text, languagecode);
            if(args.text.length>200) return  new Error("Max 200 characters");
            
            const url = googleTTS.getAudioUrl(args.text, { lang:languagecode, slow: start.slow });
            this.Triggers.urlTrigger.Card.trigger(args.device, {url:url, text:args.text} );
            return start.af ? {url:url, text:args.text} : true;
          } catch (error) { console.log('Error: ' + error); throw Error; }
        });
      }

      var actions = [
        {id:'start_googlecloudtts'},
        {id:'start_googlecloudtts_volume'},
        {id:'start_googlecloudtts_speed'},
        {id:'start_googlecloudtts_speed_pitch'},
        //{id:'start_googlecloudtts_speed_pitch_volume', voice:true },
        //{id:'start_googlecloudtts_speed_pitch_volume_af', voice:true, af:true },
        {id:'start_googlecloudtts_voice', voice:true },
        {id:'start_googlecloudtts_voice_volume', voice:true },
        {id:'start_googlecloudtts_voice_speed', voice:true },
        {id:'start_googlecloudtts_voice_speed_pitch', voice:true },
        {id:'start_googlecloudtts_voice_speed_pitch_af', voice:true, af:true },
        {id:'start_googlecloudtts_voice_speed_pitch_volume', voice:true },
        {id:'start_googlecloudtts_voice_speed_pitch_volume_af', voice:true, af:true }
      ];
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        
        const actionCard = this.homey.flow.getActionCard(action.id);
        actionCard.registerRunListener(( ( args, state ) => { //async
          const defer = new Defer();
          try {
              if(!args.device || !args.text) return false;
              //console.log('start_googlettscloudAction.registerRunListener args: ');
              TtsServer.getUrl({args, voice : args.voice }).then(url=> {
                //console.log('start_googlettscloudAction.registerRunListener url: ' + url.url);
                if(url.duration===undefined) url.duration=-1;
                args.device.setCapabilityValue('device_url', url.url);
                args.device.setCapabilityValue('device_duration', url.duration);                    
                var triggered = !!this.Triggers.cloudurlTrigger.Card.trigger(args.device, {url:url.url, text:args.text, duration :url.duration } );
                if(triggered) this.SetFinishedTimer(args.device, {url:url.url, text:args.text, duration :url.duration });
                else this.ClearFinishedTimer(args.device);
                //defer.resolve(triggered);
                defer.resolve(action.af ? {url:url.url, text:args.text, duration :url.duration } : true);
              }).catch(err=>{ console.log('err'); console.log(err); defer.reject('Did you configure the JSON and Voice in the settingspage?');});
          } catch (error) { 
            console.log('Error: ' + error);
            defer.reject('Did you configure the JSON and Voice in the settingspage?');
          }
          return defer.promise;
        }).bind(this));      
        if(action.voice) addVoiceToCard.call(this, action,actionCard);
      }

      var conditionClouds = [
        {id:'condition_googlecloudtts'},
        {id:'condition_googlecloudtts_speed'},
        {id:'condition_googlecloudtts_speed_pitch'},
        {id:'condition_say_googlecloudtts', triggerAndWait: true},
        {id:'condition_say_googlecloudtts_volume', triggerAndWait: true},
        {id:'condition_say_googlecloudtts_speed', triggerAndWait: true},
        {id:'condition_say_googlecloudtts_speed_pitch', triggerAndWait: true},    
        {id:'condition_say_googlecloudtts_speed_pitch_volume', triggerAndWait: true},      
        {id:'condition_say_googlecloudtts_voice', triggerAndWait: true, voice:true},
        {id:'condition_say_googlecloudtts_voice_volume', triggerAndWait: true, voice:true},
        {id:'condition_say_googlecloudtts_voice_speed', triggerAndWait: true, voice:true},
        {id:'condition_say_googlecloudtts_voice_speed_pitch', triggerAndWait: true, voice:true},
        {id:'condition_say_googlecloudtts_voice_speed_pitch_volume', triggerAndWait: true, voice:true}
      ];
      for (let i = 0; i < conditionClouds.length; i++) {
        const condition = conditionClouds[i];      
        const conditionCard = this.homey.flow.getConditionCard(condition.id);
        conditionCard.registerRunListener(( ( args, state ) => { //async
          const defer = new Defer();
          try {
            if(!args.device || !args.text) return Promise.resolve(false);
            //console.log('condition_googlettscloudAction.registerRunListener args: ');
            //console.log(args);
            TtsServer.getUrl({args, voice : args.voice}).then(url=> {
              const promises = [];
              
              if(url.duration===undefined) url.duration=-1;
              const p1 = args.device.setCapabilityValue('device_url', url.url);
              const p2 = args.device.setCapabilityValue('device_duration', url.duration);
              promises.push(p1);
              promises.push(p2);
              

              if(condition.triggerAndWait) {
                var triggered = !!this.Triggers.cloudurlTrigger.Card.trigger(args.device, {url:url.url, text:args.text, duration :url.duration } );
                if(triggered) promises.push(this.SetFinishedTimer(args.device, {url:url.url, text:args.text, duration :url.duration }));
                else this.ClearFinishedTimer(args.device);
              }
              
              const all = Promise.all(promises);                   
              all.then(()=> {
                defer.resolve(true);
              }).catch((err)=> {
                defer.reject();
              });
            }).catch(err=>{defer.reject('Did you configure the JSON and Voice in the settingspage?');});
          } catch (error) { 
            console.log('Error: ' + error);
            defer.reject('Did you configure the JSON and Voice in the settingspage?');
          }
          return defer.promise;
        }).bind(this));
        if(condition.voice) addVoiceToCard.call(this, condition, conditionCard);
      }

      function addVoiceToCard(condition, conditionCard) {
        conditionCard.getArgument('voice').registerAutocompleteListener((( query, args) => {
          var defer = new Defer();
          try { this.log(condition.id + '.language.registerAutocompleteListener(query, state)');            
            TtsServer.getVoices().then(list=> {
              if(query) list = list.filter(x=>x.name.toLowerCase().indexOf(query.toLowerCase())>-1)
              var r = list.map(x=> { return { id:x.name, name:x.name + ' (' + x.ssmlGender + ')', gender:x.ssmlGender, languagecode:x.languageCodes[0] }});
              defer.resolve(r) ;
            }).catch(error=> {
              this.log(condition.id + '.language.registerAutocompleteListener error: ' + error);
              loadingErrors.push(error);
            });    
          } catch (error) { 
            this.log(condition.id + '.language.registerAutocompleteListener error: ' + error);
            defer.resolve([]);
          }
        return defer.promise;
        }).bind(this)) ;
      }

      var starts = [
        {id:'finished_trigger'}
      ];
      for (let i = 0; i < starts.length; i++) {
          const start = starts[i];        
          const trigger =  this.homey.flow.getDeviceTriggerCard(start.id);
          this.Triggers[start.id].Card = trigger;
          trigger.registerRunListener(( args, state ) => {  
              // console.log( start.id + '.registerRunListener (args, state)');         
              // console.log(args);
              // console.log(state);
              return Promise.resolve( args.id && args.id.id && state.id && state.id.id && args.id.id === state.id.id );        
          });
      }
    
    } catch (error) {
      let err = error;
      try {
        if(err && typeof(err)=='object')err = JSON.stringify(err);
      } catch (error) { }
      this.homey.notifications.createNotification({excerpt : "Starting Google Services App Error: " +  err });   
      loadingErrors.push(err);
    }
    if(loadingErrors.length) {      
      this.homey.notifications.createNotification({excerpt : "Starting Google Services Error: " +loadingErrors.join(', ')});   
    }
    
  }
  
  SetFinishedTimer(device, tokens) {
    var defer = new Defer();
    this.ClearFinishedTimer(device);
    var delay = device.getSetting('delay');
    device.finishedTimer = setTimeout((()=> {        
        defer.resolve(!!this.Triggers.finished_trigger.Card.trigger(device, tokens));
    }).bind(this), tokens.duration + (delay || 1000));
    return defer.promise;
  }
  ClearFinishedTimer(device) {    
    if(device.finishedTimer) clearTimeout(device.finishedTimer);
  }
  
  // async setDefaultCloudLanguageCode() {
  //   var lg = (await this.homey.settings.get('DefaultCloudLanguageCode')) || this.homey.__('language');
  //   console.log('setDefaultCloudLanguageCode lg: ' + lg);
  //   TtsServer.DefaultCloudLanguageCode = lg;
  // }

  // async notifyWithError(message, error) {
  //   this.homey.notifications.createNotification({excerpt : "Error while setting Google Cloud JSON: " + error });    
  // }

  async setDefaultCloudVoice() {
    try {        
      var voice = await this.homey.settings.get('DefaultCloudVoice');
      if(voice) voice = JSON.parse(voice);
      var voices = await TtsServer.getVoices();
      var r;
      if(voices && voice) r = _.find(voices, v=>v.name==voice.name);
      TtsServer.DefaultCloudVoice = r; 
    } catch (error) {      
      this.homey.notifications.createNotification({excerpt : "Error while setting Google Cloud JSON: " + error });     
    }   
  }

  async setCloudJSON() {
    var json = await this.homey.settings.get('CloudJSON');
    try {      
      this.credentials = json && json!='' ? JSON.parse(json) : null;
    } catch (error) {
      this.credentials = null;
      this.homey.notifications.createNotification({excerpt : "Error while setting Google Cloud JSON: " + error });      
    }
    if(this.credentials){
      try {        
        this.client = new textToSpeech.TextToSpeechClient({credentials:this.credentials});
      } catch (error) {        
        this.homey.notifications.createNotification({excerpt : "Error while setting Google Cloud Client: " + error });    
      }
    }
    else {
      
      this.client = null;
    }
    TtsServer.client = this.client;
    //await this.credentialsUpdated();
  }
  // async credentialsUpdated() {
  //   this.emit('credentialsUpdated', this.credentials); 
  // }

}

module.exports = GoogleServicesApp;