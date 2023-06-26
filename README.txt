Use the newest Google Cloud Services, starting with the new Text-to-Speech and Translate.

Translate
U can create a Google Translate device and use it as action or a condition to translate, of which the translation will be available as a token of the device.

Text-To-Speech
Useable with any device that takes an URL.

YouTube
Search YouTube and play it on YouTube or any device that takes an URL.

All languages that Google supports, are supported.
Set voice in settings or overwrite it in a flow.
You can set Pitch, Speed, Volume Gain and Device Profile per device (will be overruled by flows with pitch and/or speed).
SSML coding is accepted now, like: <speak>Here are <say-as interpret-as=\"characters\">SSML</say-as> samples.<break time=\"3s\" />. And continue</speak>

You can also add a prefix and/or suffix pause through the device settings, which is particularly useful for Chromecast users:
A pause added the beginning will separate the notification sound and the actual speech.

Create a House device that triggers all applicable devices to say "Dinner is ready!" or just a device for the main room to say "The doorbell is ringing".
You can add "devices" as many times as you would like, each with its own trigger.
Conditions are also available!

This works great with other Apps like Sonos (Play (url) at volume), Samsung Smart TV (Laung Browser with the URL) and IFTTT.


See the community topic for explanation on how to get the necessary free Google Cloud Service Account (JSON file).

There is also an old Google TTS device, with a max. 200 characters and limited options.


For playing it on Homey itself, see Media Url Converter.


* Optional: Supports BLL coding.
See the Better Logic Library App Settings for how to use BLL coding.