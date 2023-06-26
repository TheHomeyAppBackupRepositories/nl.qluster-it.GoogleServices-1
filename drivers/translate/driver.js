'use strict';

const Homey = require('homey');
const { v4: uuidv4 } = require('uuid');
const { TranslationServiceClient } = require('@google-cloud/translate').v3;

const { Defer } = require('./../../lib/proto');
const { BL } = require('betterlogiclibrary');
var projectId = 'projects/';


class GoogleTranslateDriver extends Homey.Driver {
    async onInit() {
        this.log('GoogleTranslateDriver has been initialized');

        this.homey.settings.on('set', (function (settingName) {
            if (settingName == 'CloudJSON') {
                this.setCloudJSON();
            }
            if (settingName == 'CloudProject') {
                this.setCloudProject();
            }
        }).bind(this));
        await this.setCloudJSON();
        await this.setCloudProject();
        // this.on("credentialsUpdated", (credentials)=> {
        //     console.log("on.credentialsUpdated");
        //     console.log(credentials);
        // });

        var conditions = [
            { id: 'condition_translate' }
        ];
        for (let i = 0; i < conditions.length; i++) {
            const condition = conditions[i];
            const conditionCard = this.homey.flow.getConditionCard(condition.id);
            conditionCard.registerRunListener(((args, state) => {
                console.log(condition.id + '.registerRunListener args: ');
                var defer = new Defer();
                try {
                    if (!args.device || !args.translate || !args.targetlanguagecode) return Promise.resolve(false);
                    var promises = [];
                    promises.push(args.device.setCapabilityValue('device_translate', args.translate));

                    this.translate(args.translate, args.device.getSetting('languagecode'), args.targetlanguagecode).then((translation) => {
                        if (!translation) {
                            defer.reject("Could not translate");
                            return;
                        }
                        promises.push(args.device.setCapabilityValue('device_translation', translation));

                        var all = Promise.all(promises);
                        all.then(() => {
                            defer.resolve(true);
                            //defer.resolve({text:args.translate, translation:translation});
                        }).catch((err) => {
                            defer.reject();
                        });
                    }).catch(err => { console.log('err: ' + err); defer.reject('Did you configure the JSON and Project in the settingspage?'); });
                } catch (error) {
                    console.log(condition.id + '.registerRunListener error: ' + error);
                    defer.reject('Did you configure the JSON and Project in the settingspage?');
                }
                return defer.promise;
            }).bind(this));
        }


        var actions = [
            { id: 'action_translate' },
            { id: 'action_translate_oc', oc:2 },
            { id: 'action_translate_af', af: true },
            { id: 'action_translate_af_oc', af: true, oc:2 }
        ];
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const actionCard = this.homey.flow.getActionCard(action.id);
            actionCard.registerRunListener(async (args, state) => {
                console.log(action.id + '.registerRunListener args: ');
                var defer = new Defer();
                try {
                    if (!args.device || !args.translate) return Promise.resolve(false);
                    args.translate = await BL.decode(args.translate);

                    var promises = [];
                    promises.push(args.device.setCapabilityValue('device_translate', args.translate));

                    const targetlanguagecode = (action.oc ? (args.targetlanguagecode ? args.targetlanguagecode.id : null) :args.targetlanguagecode) || args.device.getSetting('defaulttargetlanguagecode');
                    if (!targetlanguagecode) defer.reject("Targetlanguagecode not set.");
                    const sourcelanguagecode =  (action.oc ? (args.sourcelanguagecode ? args.sourcelanguagecode.id : null) :args.sourcelanguagecode)  || args.device.getSetting('languagecode');
                    if (!sourcelanguagecode) defer.reject("Sourcelanguagecode not set.");
                    this.translate(args.translate, sourcelanguagecode, targetlanguagecode).then((translation) => {
                        if (!translation) {
                            defer.reject("Could not translate");
                            return;
                        }
                        promises.push(args.device.setCapabilityValue('device_translation', translation));

                        var all = Promise.all(promises);
                        all.then(() => {
                            defer.resolve(action.af ? { text: args.translate, translation: translation, sourcelanguagecode: sourcelanguagecode, targetlanguagecode: targetlanguagecode } : true);
                        }).catch((err) => {
                            defer.reject();
                        });
                    }).catch(err => {
                        this.error(action.id + '.registerRunListener err: ', err);
                        defer.reject('Did you configure the JSON and Project in the settingspage?\nError:' + (err.message || err));
                    });
                } catch (error) {
                    this.error(action.id + '.registerRunListener error: ', error);
                    defer.reject('Did you configure the JSON and Project in the settingspage?');
                }
                return defer.promise;
            });
            if(action.oc) {
                let autocomplete = async(query, args)=> {
                    if(this.languagesError) throw new Error(this.languagesError);
                    if(query) {
                        query = query.toLowerCase();
                        return this.languages.filter(x=>x.name.toLowerCase().indexOf(query)>-1);
                    } else return this.languages;

                };
               actionCard.registerArgumentAutocompleteListener('targetlanguagecode',autocomplete );
               if(action.oc===2)actionCard.registerArgumentAutocompleteListener('sourcelanguagecode',autocomplete );
               
            }
        }
    }


    // onPairListDevices(data, callback) {
    //     this.onPairListDevicesAsync(data).then(function(l) { callback(null, l); });

    // }

    async onPairListDevices(data) {
        return [{
            "name": 'Google Translate',
            data:
            {
                "id": uuidv4()
            },
            settings:
            {
                "languagecode": this.homey.__('languagecode') || 'en-GB',
                "defaulttargetlanguagecode": 'en-GB'
            }
        }];

    }

    async setCloudJSON() {
        try {

            var json = await this.homey.settings.get('CloudJSON');
            this.credentials = json ? JSON.parse(json) : null;
            if (this.credentials) {
                this.translateClient = new TranslationServiceClient({ credentials: this.credentials });
                await this.setLanguages();
            }
            else {
                this.translateClient = null;
                this.languages = null;
                this.languagesError = null;
            }
        } catch (error) {
            this.translateClient = null;
            this.languagesError = error;
            this.homey.notifications.createNotification({ excerpt: "Google Cloud JSON (Translation) Error: " + error });
        }
    }

    async setCloudProject() {
        var project = await this.homey.settings.get('CloudProject');
        projectId = 'projects/' + project;
        if (project && this.translateClient) {
            await this.setLanguages();
        } else {
            this.languages = null;
            //this.languagesError = null;
        }
    }
    async translate(text, source, target) {
        const [translation] = await this.translateClient.translateText({ contents: [text], sourceLanguageCode: source, targetLanguageCode: target, parent: projectId });
        return translation && translation.translations && translation.translations.length > 0 ? translation.translations[0].translatedText : null;
    }

    async setLanguages() {
        try {
            this.languages = null;
            this.languagesError = null;
            let languages = await this.translateClient.getSupportedLanguages({ parent: projectId, 
                displayLanguageCode: this.homey.i18n.getLanguage() });
            if(languages) this.languages = languages[0].languages.map(x=>{
                return {
                    name:x.displayName,
                    id:x.languageCode,
                    description:x.languageCode
                }
            });
        } catch (error) {
            this.languagesError = error;
            this.languages = null;
        }
    }

}

module.exports = GoogleTranslateDriver;