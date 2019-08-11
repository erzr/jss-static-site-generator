import LayoutService from '../LayoutService';
import GeneratorConfig from '../GeneratorConfig';
import { GeneratorLogger } from '../logging/GeneratorLogger';

export default class ConnectedLayoutService implements LayoutService {
    private readonly proxyUrl: string;
    private readonly apiKey: string;
    private readonly appName: string;
    private readonly fetch: GlobalFetch['fetch'];
    private readonly logger: GeneratorLogger;

    constructor(proxyUrl: string, apiKey: string, appName: string, 
        fetch: GlobalFetch['fetch'] | undefined, logger: GeneratorLogger | undefined) {
        
        if (!proxyUrl) {
            throw 'proxyUrl';
        }

        if (!apiKey) {
            throw 'apiKey';
        }

        if (!appName) {
            throw 'appName';
        }

        if (!fetch) {
            throw 'fetch';
        }

        if (!logger) {
            throw 'logger';
        }

        this.proxyUrl = proxyUrl;
        this.apiKey = apiKey;
        this.appName = appName;
        this.fetch = fetch;
        this.logger = logger;
    }

    start(_config:GeneratorConfig) {
        this.logger.log('Starting Connected Layout Service');
        // nothing to initialize here, we're just making http requests.
        return Promise.resolve();
    }

    fetchLayoutData(route: string, language: string) : Promise<any> {
        const layoutUrl = this.buildLayoutUrl(route, language);

        this.logger.log(`Requesting route '${route}' with language '${language}': ${layoutUrl}`);

        return this.fetch(layoutUrl)
            .then(res => {
                this.logger.log(`Status code ${res.status}: ${layoutUrl}`);
                return res.json();
            });
    }

    fetchDictionary(language: string) : Promise<any> {
        const dictionaryUrl = this.buildDictionaryUrl(language);

        this.logger.log(`Requesting dictionary for '${language}': ${dictionaryUrl}`);

        return this.fetch(dictionaryUrl)
            .then(res => {
                this.logger.log(`Status code ${res.status}: ${dictionaryUrl}`);
                return res.json();
            });
    }

    buildLayoutUrl(route: string, language: string) {
        return `${this.proxyUrl}/sitecore/api/layout/render/jss?item=${route}&sc_lang=${language}&sc_apikey=${this.apiKey}`;
    }

    buildDictionaryUrl(language: string) {
        return `${this.proxyUrl}/sitecore/api/jss/dictionary/${this.appName}/${language}?sc_apikey=${this.apiKey}`
    }

}