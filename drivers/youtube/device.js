'use strict';

const Homey = require('homey');


class YouTubeDevice extends Homey.Device
{
    play() {
        //if(this.playing)
        var driver = this.getDriver();
        
    }

}

module.exports = YouTubeDevice;