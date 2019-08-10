import LayoutService from '../LayoutService';
import GeneratorConfig from '../GeneratorConfig';

export default class ConnectedLayoutService implements LayoutService {
    private readonly proxyUrl: string;
    private readonly apiKey: string;
    private readonly appName: string;
    private readonly fetch: GlobalFetch['fetch'];

    constructor(proxyUrl: string, apiKey: string, appName: string, fetch: GlobalFetch['fetch'] | undefined) {
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

        this.proxyUrl = proxyUrl;
        this.apiKey = apiKey;
        this.appName = appName;
        this.fetch = fetch;
    }

    start(_config:GeneratorConfig) {
        // nothing to initialize here, we're just making http requests.
        return Promise.resolve();
    }

    fetchLayoutData(route: string, language: string) : Promise<any> {
        const layoutUrl = this.buildLayoutUrl(route, language);
        return this.fetch(layoutUrl)
            .then(res => res.json());
    }

    fetchDictionary(language: string) : Promise<any> {
        const dictionaryUrl = this.buildDictionaryUrl(language);
        return this.fetch(dictionaryUrl)
            .then(res => res.json());
    }

    buildLayoutUrl(route: string, language: string) {
        return `${this.proxyUrl}/sitecore/api/layout/render/jss?item=${route}&sc_lang=${language}&sc_apikey=${this.apiKey}`;
    }

    buildDictionaryUrl(language: string) {
        return `${this.proxyUrl}/sitecore/api/jss/dictionary/${this.appName}/${language}?sc_apikey=${this.apiKey}`
    }

}