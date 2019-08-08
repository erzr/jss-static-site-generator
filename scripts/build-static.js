const app = require('../build/server.bundle');
const config = require('../src/temp/config');
const fetch = require('isomorphic-fetch');
const fs = require('fs');
const path = require('path');
const packageConfig = require('../package.json');
const { ApolloClient } = require('apollo-client');
const { BatchHttpLink } = require('apollo-link-batch-http');
const { InMemoryCache } = require('apollo-cache-inmemory');
const gql = require("graphql-tag");
const scjssconfig = require('../scjssconfig.json');
const { ManifestManager, createDisconnectedLayoutService, createDisconnectedDictionaryService } = require('@sitecore-jss/sitecore-jss-dev-tools');

class GeneratorConfigFactory {

    build() {
        return {
            JSS_BUILD_STATIC: './build/static',
            JSS_DISCONNECTED_MEDIA: '/data/media',
            BUILD_DIRECTORY: './static',
            PROXY_URL: config.proxyHost || `http://localhost:${process.env.PROXY_PORT || 3042}`,
            API_KEY: config.sitecoreApiKey,
            HTML_FILE_NAME: 'index.html',
            LANGUAGE: 'en',
            ROUTE_PATH: './data/routes',
            ROUTE_TEMPLATES: [
                'App Route',
                'ExampleCustomRouteType'
            ],
            APP_SITECORE_PATH: `/sitecore/content/${config.jssAppName}`,
            MEDIA_SITECORE_PATH: `/sitecore/media library/${config.jssAppName}`,
            MEDIA_PREIX: `/-/media`,
            IS_DISCONNECTED: config.sitecoreApiKey === 'no-api-key-set'
        }
    }

}

class RotueFinderFactory {

    build(config) {
        if (config.IS_DISCONNECTED) {
            return new DisconnectedRouteFinder(config.LANGUAGE);
        }

        return new ConnectedRouteFinder(config);
    }

}

class LayoutServiceFactory {

    build(config) {
        if (config.IS_DISCONNECTED) {
            return new DisconnectedLayoutService();
        }

        return new ConnectedLayoutService(config.PROXY_URL, config.API_KEY);
    }

}

class DisconnectedLayoutService {

    start() {
        // options are largely pulled from disconnected-mode-proxy.js
        const options = {
            appRoot: path.join(__dirname, '..'),
            appName: config.appName,
            watchPaths: ['./data'],
            language: config.language,
            port: process.env.PROXY_PORT || 3042
        };

        // https://github.com/Sitecore/jss/blob/master/packages/sitecore-jss-dev-tools/src/disconnected-server/create-default-disconnected-server.ts
        const manifestManager = new ManifestManager({
            appName: options.appName,
            rootPath: options.appRoot,
            watchOnlySourceFiles: options.watchPaths,
            requireArg: options.requireArg,
            sourceFiles: options.sourceFiles,
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

    callMiddlewhere(service, query) {
        // shout out https://github.com/Sitecore/jss/blob/b41311b2aa8ed885a4d6d1d3d030da6e3496515b/docs/build/prerender.js
        const fakeRequest = {
            ...query
        };

        return new Promise((resolve, reject) => {
            const fakeResponse = {
                sendStatus: function (statusCode) {
                    reject();
                },
                json: function (result) {
                    resolve(result);
                },
            };

            service.middleware(fakeRequest, fakeResponse);
        });
    }

    fetchLayoutData(route, language) {
        // https://github.com/Sitecore/jss/blob/master/packages/sitecore-jss-dev-tools/src/disconnected-server/layout-service.ts
        return this.callMiddlewhere(this.layoutService, {
            query: {
                sc_lang: language,
                item: route
            }
        });
    }

    fetchDictionary(language) {
        // https://github.com/Sitecore/jss/blob/master/packages/sitecore-jss-dev-tools/src/disconnected-server/dictionary-service.ts
        return this.callMiddlewhere(this.dictionaryService, {
            params: {
                language
            }
        });
    }
}

class ConnectedLayoutService {

    constructor(proxyUrl, apiKey) {
        this.proxyUrl = proxyUrl;
        this.apiKey = apiKey;
    }

    start() {
        // nothing to initialize here, we're just making http requests.
        return Promise.resolve();
    }

    fetchLayoutData(route, language) {
        const layoutUrl = this.buildLayoutUrl(route, language);
        return fetch(layoutUrl)
            .then(res => res.json());
    }

    fetchDictionary(language) {
        const dictionaryUrl = this.buildDictionaryUrl(language);
        return fetch(dictionaryUrl)
            .then(res => res.json());
    }

    buildLayoutUrl(route, language) {
        return `${this.proxyUrl}/sitecore/api/layout/render/jss?item=${route}&sc_lang=${language}&sc_apikey=${this.apiKey}`;
    }

    buildDictionaryUrl(language) {
        return `${this.proxyUrl}/sitecore/api/jss/dictionary/${packageConfig.config.appName}/${language}?sc_apikey=${this.apiKey}`
    }

}

class DisconnectedRouteFinder {

    constructor(language) {
        this.routeFilePattern = new RegExp(`^${language}\\.(yaml|yml|json)$`, 'i');
    }

    findRoutes(routePath, parts) {
        const foundRoutes = this.findRoutesSync(routePath, parts);
        return Promise.resolve(foundRoutes);
    }

    findRoutesSync(routePath, parts) {
        const foundRoutes = [],
            pathParts = parts || [];

        const files = fs.readdirSync(routePath);

        files.forEach(file => {
            const fullPath = path.join(routePath, file);

            if (fs.lstatSync(fullPath).isFile()) {
                if (this.routeFilePattern.test(file)) {
                    const joined = pathParts.join('/');
                    foundRoutes.push(`/${joined}`);
                }
            } else {
                pathParts.push(file);

                const nestedRoutes = this.findRoutesSync(fullPath, pathParts);

                if (nestedRoutes && nestedRoutes.length) {
                    foundRoutes.push(...nestedRoutes);
                }

                pathParts.pop();
            }
        });

        return foundRoutes;
    }

}

class GraphQLClientFactory {

    build() {
        const link = new BatchHttpLink({ uri: config.graphQLEndpoint, credentials: 'include' });
        const cache = new InMemoryCache();

        const graphQLClient = new ApolloClient({
            link,
            cache
        });

        return graphQLClient;
    }

}

class RecursiveItemFinder {

    async find(query, rootPath, filterFunction) {
        const graphQLClient = new GraphQLClientFactory().build();
        const queryResult = await this.runFindQuery(query, rootPath, rootPath, filterFunction, graphQLClient);
        return queryResult;
    }

    // adapted from https://gist.github.com/lovasoa/8691344
    async runFindQuery(query, rootPath, pathToQuery, filterFunction, gqlClient) {
        const graphQLClient = gqlClient || new GraphQLClientFactory().build();

        let children = await this.requestData(graphQLClient, query, pathToQuery);

        children = await Promise.all(children.map(async child => {
            const isMatch = filterFunction(child);
            const matches = [];

            if (child.hasChildren) {
                const subItems = await this.runFindQuery(query, rootPath, child.path, filterFunction, graphQLClient);
                matches.push(...subItems);
            }

            if (isMatch) {
                const cleanPath = child.path.replace(rootPath + '/home', '/').replace('//', '/'); // meh, revisit
                matches.push({
                    child,
                    route: cleanPath
                })
            }

            return Promise.resolve(matches);
        }));

        return children.reduce((all, foundRoutes) => all.concat(foundRoutes), []);
    }

    requestData(client, query, path) {
        return client.query({
            variables: { path },
            query: query
        }).then((response) => response.data.item.children);
    }
}

const RouteQuery = gql`
query SiteQuery($path:String) {
  item(path: $path) {
    children {
      hasChildren
      path
      template {
        name
      }
    }
  }
}
`;

class ConnectedRouteFinder {

    constructor(config) {
        this.config = config;
    }

    findRoutes() {
        return new Promise((resolve) => {
            const recursiveFinder = new RecursiveItemFinder();
            return recursiveFinder.find(RouteQuery, this.config.APP_SITECORE_PATH,
                (child) => this.config.ROUTE_TEMPLATES.indexOf(child.template.name) >= 0)
                .then(allRoutes => {
                    const justRoutes = allRoutes.map(x => x.route);
                    resolve(justRoutes);
                });
        });
    }

}

const MediaQuery = gql`
query MediaQuery($path:String) {
  item(path: $path) {
    children {
      hasChildren
      name
      path
      url
      template {
        name
      }
      extension:field(name:"Extension"){
        value
      }
    }
  }
}
`;

class MediaFinder {

    constructor(config) {
        this.config = config;
    }

    findMedia() {
        return new Promise((resolve) => {
            const recursiveFinder = new RecursiveItemFinder();
            return recursiveFinder.find(MediaQuery, this.config.MEDIA_SITECORE_PATH,
                (child) => child.extension)
                .then(allRoutes => {
                    resolve(allRoutes);
                });
        });
    }

}

class FileSystemUtilities {

    ensureDirectoryExists(to) {
        const pieces = to.split('/');

        let pathPieces = [];
        pieces.forEach(element => {
            pathPieces.push(element);

            const joined = pathPieces.join('/');

            if (!fs.existsSync(joined)) {
                fs.mkdirSync(joined);
            }
        })
    }

    copyFolderSync(from, to) {
        this.ensureDirectoryExists(to);

        fs.readdirSync(from).forEach(element => {
            if (fs.lstatSync(path.join(from, element)).isFile()) {
                fs.copyFileSync(path.join(from, element), path.join(to, element));
            } else {
                this.copyFolderSync(path.join(from, element), path.join(to, element));
            }
        });
    }

}

class StaticSiteGenerator {

    constructor() {
        this.config = new GeneratorConfigFactory().build();
        this.layoutService = new LayoutServiceFactory().build(this.config);
        this.routeFinder = new RotueFinderFactory().build(this.config);
        this.fileSystemUtilities = new FileSystemUtilities();
        this.mediaFinder = new MediaFinder(this.config);
    }

    start() {
        return this.layoutService.start();
    }

    writeRouteToDisk(route, error, html) {
        const output_dir = this.config.BUILD_DIRECTORY + (!route.endsWith('/') ? route + '/' : route),
            output = output_dir + this.config.HTML_FILE_NAME;

        this.fileSystemUtilities.ensureDirectoryExists(output_dir);

        if (error) {
            console.error(error);
        } else {
            fs.writeFileSync(output, html, { encoding: 'utf8' });
        }
    }

    renderViewToHtml(renderView, data, viewPath, viewBag) {
        return new Promise((resolve, reject) => {
            const renderCallback = (error, content) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(content.html);
                }
            };

            renderView(renderCallback, viewPath, data, viewBag);
        });
    }

    handleRoute(route, viewBag) {
        return this.layoutService.fetchLayoutData(route, this.config.LANGUAGE)
            .then(result => this.renderViewToHtml(app.renderView, result, route, viewBag))
            .then(html => this.writeRouteToDisk(route, null, html));
    }

    copyMedia(isDisconnected) {
        this.fileSystemUtilities.copyFolderSync(this.config.JSS_BUILD_STATIC, `${this.config.BUILD_DIRECTORY}${packageConfig.config.sitecoreDistPath}/static`);

        if (isDisconnected) {
            this.fileSystemUtilities.copyFolderSync(`.${this.config.JSS_DISCONNECTED_MEDIA}`,
                `${this.config.BUILD_DIRECTORY}${this.config.JSS_DISCONNECTED_MEDIA}`);
            return Promise.resolve();
        } else {
            return this.copyMediaLibraryFolder();
        }
    }

    // https://stackoverflow.com/questions/37614649/how-can-i-download-and-save-a-file-using-the-fetch-api-node-js
    async downloadFile(url, path) {
        console.log('DOWNLOADING: ' + url + ' to ' + path);
        const res = await fetch(url);
        const fileStream = fs.createWriteStream(path);
        await new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on("error", (err) => {
                reject(err);
            });
            fileStream.on("finish", function () {
                resolve();
            });
        });
    }

    cleanMediaUrl(item) {
        return item.url
            .replace(`${this.config.MEDIA_PREIX}/${config.jssAppName}`, '')
            .replace('.ashx', `.${item.extension.value}`);
    }

    copyMediaLibraryFolder() {
        return this.mediaFinder.findMedia()
            .then(media => {
                return Promise.all(media.map(async mediaItem => {
                    const cleanUrl = this.cleanMediaUrl(mediaItem.child),
                        path = `${this.config.BUILD_DIRECTORY}${cleanUrl}`,
                        pathWithoutFile = path.substring(0, path.lastIndexOf("/"));

                    this.fileSystemUtilities.ensureDirectoryExists(pathWithoutFile);
                    return this.downloadFile(scjssconfig.sitecore.layoutServiceHost + mediaItem.child.url, path);
                }))
            });
    }

    async handleServerReady() {
        const viewBag = await this.buildViewBag();

        return this.routeFinder.findRoutes(this.config.ROUTE_PATH)
            .then(routesToProcess => {
                if (routesToProcess) {

                    var chain = Promise.resolve();

                    routesToProcess.forEach(route => {
                        chain = chain.then(() => this.handleRoute(route, viewBag));
                    });

                    chain = chain.then(() => this.copyMedia(this.config.IS_DISCONNECTED));

                    return chain;
                }
            })
            .catch((e) => console.log(e));
    }

    async buildViewBag() {
        const dictionary = await this.layoutService.fetchDictionary(this.config.LANGUAGE);

        return {
            dictionary
        }
    }

    run() {
        return this.handleServerReady();
    }

}

const generator = new StaticSiteGenerator();

generator
    .start()
    .then(() => generator.run())
    .then(() => console.log('Static Site Generated'))
    .then(() => process.exit(0));