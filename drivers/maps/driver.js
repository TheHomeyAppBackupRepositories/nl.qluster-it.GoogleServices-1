'use strict';

const Homey = require('homey');
const { v4: uuidv4 } = require('uuid');

const {Client} = require("@googlemaps/google-maps-services-js");

const { Defer } = require('../../lib/proto');

class MapsDriver extends Homey.Driver
{
    async onInit()
    {
        return;
        await this.setMapsAPIKey();
        const client = new Client({});
            //client.directions({});
            client
            .elevation({
                params: {
                    key: this.mapsApiKey,
                    locations: [{ lat: 45, lng: -110 }]
                },
                timeout: 1000, // milliseconds
            })
            .then((r) => {
                console.log(r.data.results[0].elevation);
            })
            .catch((e) => {
                console.log(e.response.data.error_message);
            });

            // client
            // .elevation({
            //     params: {
            //         key: this.mapsApiKey,
            //         locations: [{ lat: 45, lng: -110 }]
            //     },
            //     timeout: 1000, // milliseconds
            // })
            // .then((r) => {
            //     console.log(r.data.results[0].elevation);
            // })
            // .catch((e) => {
            //     console.log(e.response.data.error_message);
            // });
            
        // this.log('MapsDriver has been initialized');
        // this.Triggers = {
        //   mapstrigger : {}
        // };
        // const maps_trigger = this.homey.flow.getDeviceTriggerCard('maps_trigger');
        // this.Triggers.mapstrigger.Card = maps_trigger;
        // maps_trigger.registerRunListener( async ( args, state ) => { console.log('maps_trigger.registerRunListener'); console.log(args);  return true; });



        // var actions = [
        //   {id:'maps_search'},          
        //   {id:'maps_search_af', af:true}
        // ];
        // for (let i = 0; i < actions.length; i++) {
        //   const action = actions[i];
          
        //   const actionCard = this.homey.flow.getActionCard(action.id);
        //   actionCard.registerRunListener(( ( args, state ) => { //async
        //     var defer = new Defer();
        //     try {
        //         if(!args.device || !args.text) return Promise.resolve(false);
        //         console.log('maps_search.registerRunListener args: ');
                
        //         search(args.text, this.options, (err, results)=> {
        //           if(err) {
        //             defer.reject('Did you configure the API Key in the settingspage?');
        //             return this.log(err);
        //           }
        //           var result = results && results.length>0 ? results[0] : null;
        //           if(result) {
        //             this.log(result);
        //             this.Triggers.mapstrigger.Card.trigger(args.device, {id:result.id, link:result.link, text:args.text } );
        //             defer.resolve(action.af? {id:result.id, link:result.link, text:args.text } : true);
        //           } else defer.reject('Nothing found.');
                  
        //           // args.device.results = results;
        //           // args.device.play();
                
        //           // this.log(results);
        //         });

        //         // TtsServer.getUrl({args, voice : args.voice }).then(url=> {
        //         //   console.log('start_googlettscloudAction.registerRunListener url: ' + url.url);
        //         //   args.device.setCapabilityValue('device_url', url.url);
        //         //   args.device.setCapabilityValue('device_duration', url.duration);                    
        //         //   var triggered = !!this.Triggers.cloudurlTrigger.Card.trigger(args.device, {url:url.url, text:args.text, duration :url.duration } );
        //         //   if(triggered) this.SetFinishedTimer(args.device, {url:url.url, text:args.text, duration :url.duration });
        //         //   else this.ClearFinishedTimer(args.device);
        //         //   defer.resolve(triggered);
        //         // }).catch(err=>{ console.log('err'); console.log(err); defer.reject('Did you configure the JSON and Voice in the settingspage?');});
        //     } catch (error) { 
        //       console.log('Error: ' + error);
        //       defer.reject('Did you configure the API Key in the settingspage?');
        //     }
        //     return defer.promise;
        //   }).bind(this));      
        // }


        this.homey.settings.on('set', (settingName)=> {
          if(settingName=='MapsApiKey') 
              this.setMapsAPIKey();
        });
        
        this.setMapsAPIKey();
    }

    async setMapsAPIKey() {
      
      this.mapsApiKey = await this.homey.settings.get('MapsApiKey');
    //   this.options = {
        
    //   part: 'id,snippet',
    //     maxResults:1,        
    //     type: 'video',
    //     key:key
    //   };
    }

    async onPairListDevices(data)
    {
        //console.log('onPairListDevicesAsync');
        //console.log(data);
        const firstId = 'mapsdevice';
        let devices = this.getDevices();
        if(devices && devices.length>0) devices = _.filter(devices, device=> device.getData().id==firstId);
        var id = devices && devices.length>0 ? uuidv4() : firstId;
        return [{
            "name": 'Maps device',
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

module.exports = MapsDriver;