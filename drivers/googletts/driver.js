'use strict';

const Homey = require('homey');
const { v4: uuidv4 } = require('uuid');

class GoogleTTSDriver extends Homey.Driver
{
    async onInit()
    {
        this.log('GoogleTTSDriver has been initialized');        

    }
    
    async onPairListDevices()
    {
        return [{
            "name": 'Google TTS device',
            data:
            {
                "id": uuidv4()
            },
            settings:
            {
                "languagecode": this.homey.__('languagecode') || 'en-GB'
            }
        }];

    }

}

module.exports = GoogleTTSDriver;