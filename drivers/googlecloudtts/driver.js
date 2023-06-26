'use strict';

const Homey = require('homey');
const { v4: uuidv4 } = require('uuid');

class GoogleCloudTTSDriver extends Homey.Driver
{
    async onInit()
    {
        this.log('GoogleCloudTTSDriver has been initialized');        

    }

    async onPairListDevices(data)
    {
        return [{
            "name": 'Google Cloud TTS device',
            data:
            {
                "id": uuidv4()
            },
            settings:
            {
                "languagecode": "default",
                "delay" : 1000,
                "speakingRate" : 1,
                "pitch" : 0,
                "deviceprofile" : "undefined",
                "volumeGainDb" : 0,
                "prefixpause" : 0,
                "suffixpause" : 0,
                "defaultspeak" : false
            }
        }];

    }

    onRepair( socket, device ) {
        var settings = device.getSettings();
        const devices = [
          {
            'name': device.name,
            'data': {
              'id': uuidv4()//device.id,
            }//,
            // "settings":
            // {
            //     "languagecode": settings.languagecode || "default",
            //     "speakingRate" : settings.speakingRate || 1,
            //     "pitch" : settings.pitch || 0
            // }
          }
        ]
        //var devices = [device];
        socket.on('list_devices', function( data, callback ) {
            // emit when devices are still being searched
            socket.emit('list_devices', devices );
            console.log('list_devices');
            var capabilities = device.getCapabilities();
            var caps = [ 'device_url', 'device_duration' ];
            for (let i = 0; i < caps.length; i++) {
                const cap = caps[i];
                if(!capabilities.indexOf(cap)>-1) device.addCapability(cap);                
            }

    
          // fire the callback when searching is done
          callback( null, devices );
    
          // when no devices are found, return an empty array
          // callback( null, [] );
    
          // or fire a callback with Error to show that instead
          // callback( new Error('Something bad has occured!') );
        });
      }

}

module.exports = GoogleCloudTTSDriver;