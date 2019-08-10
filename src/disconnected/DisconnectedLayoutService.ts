import {join} from 'path';
import GeneratorConfig from '../GeneratorConfig';
import {ManifestManager, createDisconnectedLayoutService, createDisconnectedDictionaryService} from '@sitecore-jss/sitecore-jss-dev-tools';
import LayoutService from '../LayoutService';

export default class DisconnectedLayoutService  implements LayoutService {
    layoutService: any;
    dictionaryService: any;

    start(config:GeneratorConfig) : Promise<any> {
        // options are largely pulled from disconnected-mode-proxy.js
        const options = {
            appRoot: join(__dirname, '..'),
            appName: config.APP_NAME,
            language: config.LANGUAGE
        };

        // https://github.com/Sitecore/jss/blob/master/packages/sitecore-jss-dev-tools/src/disconnected-server/create-default-disconnected-server.ts
        const manifestManager = new ManifestManager({
            appName: options.appName,
            rootPath: options.appRoot
        });

        return manifestManager
            .getManifest(options.language)
            .then((manifest) => {
                this.layoutService = createDisconnectedLayoutService({
                    manifest,
                    manifestLanguageChangeCallback: manifestManager.getManifest
                });

                this.dictionaryService = createDisconnectedDictionaryService({
                    manifest,
                    manifestLanguageChangeCallback: manifestManager.getManifest,
                });
            });
    }

    callMiddlewhere(service: any, query: any) : Promise<any> {
        // shout out https://github.com/Sitecore/jss/blob/b41311b2aa8ed885a4d6d1d3d030da6e3496515b/docs/build/prerender.js
        const fakeRequest = {
            ...query
        };

        return new Promise((resolve, reject) => {
            const fakeResponse = {
                sendStatus: function () {
                    reject();
                },
                json: function (result: any) {
                    resolve(result);
                },
            };

            service.middleware(fakeRequest, fakeResponse);
        });
    }

    fetchLayoutData(route: string, language: string) : Promise<any> {
        // https://github.com/Sitecore/jss/blob/master/packages/sitecore-jss-dev-tools/src/disconnected-server/layout-service.ts
        return this.callMiddlewhere(this.layoutService, {
            query: {
                sc_lang: language,
                item: route
            }
        });
    }

    fetchDictionary(language: string) : Promise<any> {
        // https://github.com/Sitecore/jss/blob/master/packages/sitecore-jss-dev-tools/src/disconnected-server/dictionary-service.ts
        return this.callMiddlewhere(this.dictionaryService, {
            params: {
                language
            }
        });
    }
}