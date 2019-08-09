export default interface GeneratorConfig {
    LANGUAGE: string;
    APP_NAME: string;
    API_KEY: string;
    PROXY_URL: string;
    IS_DISCONNECTED: any;
    MEDIA_SITECORE_PATH: string;
    ROUTE_TEMPLATES: string[];
    APP_SITECORE_PATH: string;
    graphQLEndpoint: string;
    fetch: GlobalFetch['fetch'];
}