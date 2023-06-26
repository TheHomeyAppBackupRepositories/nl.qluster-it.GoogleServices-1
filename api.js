const TtsServer = require("./lib/tts-server");

module.exports = {
  async getVoices({ homey, query }) {
    const result = await TtsServer.getVoices();
    return result;
  }
    // {
    //   method: 'GET',
    //   path: '/getVoices',
    //   public: true,
    //   fn: function( args, callback ){
    //     TtsServer.getVoices().then(voices=> {
    //         callback( null, voices );
    //     });
    //   }
    // }  
}