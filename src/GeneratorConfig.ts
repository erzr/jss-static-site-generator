interface App {
    renderView(renderCallback: (error: string, content: any) => void, viewPath: any, data: any, viewBag: any): Promise<any>;
}

export default interface GeneratorConfig {
    LAYOUT_SERVICE_HOST: string;
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
    JSS_BUILD_STATIC: string;
    JSS_DISCONNECTED_MEDIA: string;
    BUILD_DIRECTORY: string;
    HTML_FILE_NAME: string;
    ROUTE_PATH: string;
    MEDIA_PREIX: string;
    SITECORE_DIST_PATH: string;
    renderView: App['renderView'];
}