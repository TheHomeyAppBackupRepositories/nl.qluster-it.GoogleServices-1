'use strict';

const Homey = require('homey');
const { v4: uuidv4 } = require('uuid');
const search = require('youtube-search');
const { BL } = require('betterlogiclibrary');

const { Defer } = require('../../lib/proto');

class YouTubeDriver extends Homey.Driver
{
    async onInit()
    {
        this.log('YouTubeDriver has been initialized');
        this.Triggers = {
          youtubetrigger : {}
        };
        const youtube_trigger = this.homey.flow.getDeviceTriggerCard('youtube_trigger');
        this.Triggers.youtubetrigger.Card = youtube_trigger;
        youtube_trigger.registerRunListener( async ( args, state ) => { console.log('youtube_trigger.registerRunListener'); console.log(args);  return true; });



        var actions = [
          {id:'youtube_search'},          
          {id:'youtube_search_af', af:true}
        ];
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          
          const actionCard = this.homey.flow.getActionCard(action.id);
          actionCard.registerRunListener( async ( args, state ) => { //async
            var defer = new Defer();
            try {
                if(!args.device || !args.text) return Promise.resolve(false);
                console.log('youtube_search.registerRunListener args: ');
                
                //args.text = await BL.decode(args.text);

                search(args.text, this.options, (err, results)=> {
                  if(err) {
                    defer.reject('Did you configure the API Key in the settingspage?');
                    return this.log(err);
                  }
                  var result = results && results.length>0 ? results[0] : null;
                  if(result) {
                    this.log(result);
                    this.Triggers.youtubetrigger.Card.trigger(args.device, {id:result.id, link:result.link, text:args.text } );
                    defer.resolve(action.af? {id:result.id, link:result.link, text:args.text } : true);
                  } else defer.reject('Nothing found.');
                  
                  // args.device.results = results;
                  // args.device.play();
                
                  // this.log(results);
                });

                // TtsServer.getUrl({args, voice : args.voice }).then(url=> {
                //   console.log('start_googlettscloudAction.registerRunListener url: ' + url.url);
                //   args.device.setCapabilityValue('device_url', url.url);
                //   args.device.setCapabilityValue('device_duration', url.duration);                    
                //   var triggered = !!this.Triggers.cloudurlTrigger.Card.trigger(args.device, {url:url.url, text:args.text, duration :url.duration } );
                //   if(triggered) this.SetFinishedTimer(args.device, {url:url.url, text:args.text, duration :url.duration });
                //   else this.ClearFinishedTimer(args.device);
                //   defer.resolve(triggered);
                // }).catch(err=>{ console.log('err'); console.log(err); defer.reject('Did you configure the JSON and Voice in the settingspage?');});
            } catch (error) { 
              console.log('Error: ' + error);
              defer.reject('Did you configure the API Key in the settingspage?');
            }
            return defer.promise;
          });
        }


        this.homey.settings.on('set', (settingName)=> {
          if(settingName=='CloudApiKey') 
              this.setYouTubeAPIKey();
        });
        
        this.setYouTubeAPIKey();
    }

    async setYouTubeAPIKey() {
      
      var key = await this.homey.settings.get('CloudApiKey');
      this.options = {
        
      part: 'id,snippet',
        maxResults:1,        
        type: 'video',
        key:key
      };
    }

    async onPairListDevices(data)
    {
        //console.log('onPairListDevicesAsync');
        //console.log(data);
        const firstId = 'youtubedevice';
        let devices = this.getDevices();
        if(devices && devices.length>0) devices = _.filter(devices, device=> device.getData().id==firstId);
        var id = devices && devices.length>0 ? uuidv4() : firstId;
        return [{
            "name": 'YouTube device',
            data:
            {
                "id": id
            },
            settings:
            {
            }
        }];

    }


}

module.exports = YouTubeDriver;