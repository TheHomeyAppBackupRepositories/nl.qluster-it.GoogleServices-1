'use strict';

const Homey = require('homey');


class GoogleTTSDevice extends Homey.Device
{
    async onInit() {
        if (this.hasCapability('device_duration') === false) await this.addCapability('device_duration');
        if (this.hasCapability('device_url') === false) await this.addCapability('device_url');
      }

}

module.exports = GoogleTTSDevice;