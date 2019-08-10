import {writeFileSync} from 'fs';
import LayoutServiceFactory from './LayoutServiceFactory';
import RouteFinderFactory from './RouteFinderFactory';
import FileSystemUtilities from './FileSystemUtilities';
import MediaFinder from './MediaFinder';
import GeneratorConfig from './GeneratorConfig';
import LayoutService from './LayoutService';
import RouteFinder from './RouteFinder';
import MediaFinderFactory from './MediaFinderFactory';

export class StaticSiteGenerator {
    config: GeneratorConfig;
    layoutService: LayoutService;
    fileSystemUtilities: FileSystemUtilities;
    routeFinder: RouteFinder;
    mediaFinder: MediaFinder;

    constructor(config:GeneratorConfig) {
        this.config = config;
        this.layoutService = new LayoutServiceFactory().build(this.config);
        this.routeFinder = new RouteFinderFactory().build(this.config);
        this.fileSystemUtilities = new FileSystemUtilities();
        this.mediaFinder = new MediaFinderFactory().build(this.config, this.fileSystemUtilities);
    }

    start() {
        return this.layoutService.start(this.config);
    }

    writeRouteToDisk(route: string, error: string, html: string) {
        const output_dir = this.config.BUILD_DIRECTORY + (!route.endsWith('/') ? route + '/' : route),
            output = output_dir + this.config.HTML_FILE_NAME;

        this.fileSystemUtilities.ensureDirectoryExists(output_dir);

        if (error) {
            console.error(error);
        } else {
            writeFileSync(output, html, { encoding: 'utf8' });
        }
    }

    renderViewToHtml(data: any, viewPath: string, viewBag: any) : Promise<string> {
        return new Promise((resolve, reject) => {
            const renderCallback = (error: string, content: any) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(content.html);
                }
            };

            this.config.renderView(renderCallback, viewPath, data, viewBag);
        });
    }

    handleRoute(route: string, viewBag: any) {
        return this.layoutService.fetchLayoutData(route, this.config.LANGUAGE)
            .then(result => this.renderViewToHtml(result, route, viewBag))
            .then(html => this.writeRouteToDisk(route, '', html));
    }

    copyClientFiles() {
        this.fileSystemUtilities.copyFolderSync(this.config.JSS_BUILD_STATIC, `${this.config.BUILD_DIRECTORY}${this.config.SITECORE_DIST_PATH}/static`);
    }

    async handleServerReady() {
        const viewBag = await this.buildViewBag();

        this.copyClientFiles();

        return this.routeFinder.findRoutes()
            .then(routesToProcess => {
                if (routesToProcess) {

                    var chain = Promise.resolve();

                    routesToProcess.forEach(route => {
                        chain = chain.then(() => this.handleRoute(route, viewBag));
                    });

                    chain = chain.then(() => this.mediaFinder.copyMedia());

                    return chain;
                } else {
                    console.log('No Routes Found');
                    return Promise.resolve();
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