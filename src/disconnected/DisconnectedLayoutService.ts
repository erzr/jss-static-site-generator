import {join} from 'path';
import GeneratorConfig from '../GeneratorConfig';
import {ManifestManager, createDisconnectedLayoutService, createDisconnectedDictionaryService} from '@sitecore-jss/sitecore-jss-dev-tools';
import LayoutService from '../LayoutService';
import { GeneratorLogger } from '../logging/GeneratorLogger';

export default class DisconnectedLayoutService  implements LayoutService {
    
    private readonly logger: GeneratorLogger;

    layoutService: any;
    dictionaryService: any;


    constructor(logger: GeneratorLogger) {
        if (!logger) {
            throw 'logger';
        }

        this.logger = logger;
    }

    start(config:GeneratorConfig) : Promise<any> {
        this.logger.log('Starting Disconnected Layout Service');

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

        this.logger.log('Building Manifest');

        return manifestManager
            .getManifest(options.language)
            .then((manifest) => {

                this.logger.log('Building Layout Service');

                this.layoutService = createDisconnectedLayoutService({
                    manifest,
                    manifestLanguageChangeCallback: manifestManager.getManifest
                });

                this.logger.log('Building Dictionary Service');

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

        this.logger.log(`Requesting route '${route}' with language '${language}'`);

        return this.callMiddlewhere(this.layoutService, {
            query: {
                sc_lang: language,
                item: route
            }
        });
    }

    fetchDictionary(language: string) : Promise<any> {
        // https://github.com/Sitecore/jss/blob/master/packages/sitecore-jss-dev-tools/src/disconnected-server/dictionary-service.ts

        this.logger.log(`Requesting dictionary for '${language}'`);

        return this.callMiddlewhere(this.dictionaryService, {
            params: {
                language
            }
        });
    }
}