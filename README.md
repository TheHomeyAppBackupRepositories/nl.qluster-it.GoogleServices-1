Use the newest Google Cloud Services, starting with the new Text-to-Speech and Translate.


Translate
U can make a Google Translate device and use it as action or a condition to translate, of which the transalation will be available as a tokenvalue of the device.


For this you will need https://cloud.google.com/translate/docs/setup#api and enter the JSON and Project in the settings.


Text-To-Speech
Useable with any device that thakes an URL.

Cloud devices:
All languages that Google supports, are supported, because the settings are build from live data, so when a new language becames available, it will be for this App also.
Currently you can only set the Voice in the settings, but it will be setable per device in the near future.
You can set Pitch, Speed, Volume Gain and Device Profile per device (will be overruled by flows with pitch and/or speed).

SSML coding is accepted now, like: <speak>Here are <say-as interpret-as=\"characters\">SSML</say-as> samples.<break time=\"3s\" />. And continue</speak>
https://cloud.google.com/text-to-speech/docs/ssml

Also you can add a prefix and/or suffix pause in the device settings, which is particularly useful for Chromecast users:
A pause added the beginning will separate the notification sound and the actual speech.

You get a URL for the audio that will be streamed through Homey, so the device eventually playing the mp3 file should be in the same network and have access.
The last 100 transcripts are stored in Homey's Memory for speed and less requests to Google Cloud (restart of app or Homey means reset of memory).

Create a House device that triggers all applicable devices to say "Dinner is ready!" or just a device for the main room to say "The doorbell is ringing".
You can add "devices" as many times as you would like, each with its own trigger.
Conditions are also available! You can let a flow wait in de condition till speech is finished before turning to the Then part of the flow.

This works great with other Apps like Sonos (Play URL), Samsung Smart TV (Laung Browser with the URL), Sonos Say (Url) and IFTTT.


For this you wil need to generate your own Google Cloud Service Account at
https://cloud.google.com/text-to-speech/docs/libraries#setting_up_authentication
and fill-in the JSON in the settings.
Also you need to activate/add the "Cloud Text-to-Speech API" library in cloud.google.com.
In total, above is the same as step 1 , 2, 3, and 4 of https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries?authuser=1#before-you-begin

It's free upto 4 million characters per month for non-Wavenet voices AND 1 million characters per month for Wavenet voices.
(To see how many characters you have used up, goto the Google Cloud Console homepage, and to the right click on View detailed charges (the filter Group By SKU should be on))



There is the also old Google TTS device, with a max. 200 characters and limited options.
These languages are currently supported in Non-Cloud:
Engels (GB)
English (US)
Dutch (NL)
Dutch (BE)
German (DE)
German (LU)
French (FR)
French (BE)
Spanish (ES)
Italian (IT)
Swedish (SV)
Norwegian (NO)


For playing it on Homey itself, see Media Url Converter.
