import {writeFileSync} from 'fs';
import LayoutServiceFactory from './LayoutServiceFactory';
import RouteFinderFactory from './RouteFinderFactory';
import FileSystemUtilities from './FileSystemUtilities';
import MediaFinder from './MediaFinder';
import GeneratorConfig from './GeneratorConfig';
import LayoutService from './LayoutService';
import RouteFinder from './RouteFinder';
import MediaFinderFactory from './MediaFinderFactory';
import { GeneratorLogger } from './logging/GeneratorLogger';
import ConsoleGeneratorLogger from './logging/ConsoleGeneratorLogger';

export class StaticSiteGenerator {
    config: GeneratorConfig;
    layoutService: LayoutService;
    fileSystemUtilities: FileSystemUtilities;
    routeFinder: RouteFinder;
    mediaFinder: MediaFinder;
    logger: GeneratorLogger;

    constructor(config:GeneratorConfig) {
        this.config = config;
        this.logger = config.logger || new ConsoleGeneratorLogger();

        this.logger.log('Initializing Services');

        this.layoutService = new LayoutServiceFactory().build(this.config, this.logger);
        this.routeFinder = new RouteFinderFactory().build(this.config, this.logger);
        this.fileSystemUtilities = new FileSystemUtilities(this.logger);
        this.mediaFinder = new MediaFinderFactory().build(this.config, this.fileSystemUtilities, this.logger);
    }

    start() {
        this.logger.log("Starting Layout Service");
        return this.layoutService.start(this.config);
    }

    writeRouteToDisk(route: string, error: string, html: string) {
        const output_dir = this.config.BUILD_DIRECTORY + (!route.endsWith('/') ? route + '/' : route),
            output = output_dir + this.config.HTML_FILE_NAME;

        this.logger.log(`Writing Route: ${route} to ${output}`);

        this.fileSystemUtilities.ensureDirectoryExists(output_dir);

        if (error) {
            this.logger.error(error);
        } else {
            writeFileSync(output, html, { encoding: 'utf8' });
        }
    }

    renderViewToHtml(data: any, viewPath: string, viewBag: any) : Promise<string> {
        this.logger.log(`Rendering Route: ${viewPath}`);

        return new Promise((resolve, reject) => {
            const renderCallback = (error: string, content: any) => {
                this.logger.log(`Route Rendered: ${viewPath}, Successful: ${!error}`);

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
        this.logger.log(`Processing Route: ${route}`);

        return this.layoutService.fetchLayoutData(route, this.config.LANGUAGE)
            .then(result => this.renderViewToHtml(result, route, viewBag))
            .then(html => this.writeRouteToDisk(route, '', html));
    }

    copyClientFiles() {
        const sourceClientFiles = this.config.JSS_BUILD_STATIC;
        const destinationClientFiles = `${this.config.BUILD_DIRECTORY}${this.config.SITECORE_DIST_PATH}/static`;

        this.logger.log(`Copying ${sourceClientFiles} to ${destinationClientFiles}`);

        this.fileSystemUtilities.copyFolderSync(sourceClientFiles, destinationClientFiles);
    }

    async buildViewBag() {
        this.logger.log('Building ViewBag');

        const dictionary = await this.layoutService.fetchDictionary(this.config.LANGUAGE);

        return {
            dictionary
        }
    }

    async run() {
        this.logger.log(`Starting Generator (Disconnected: ${this.config.IS_DISCONNECTED})`);

        const viewBag = await this.buildViewBag();

        this.copyClientFiles();

        this.logger.log('Starting Route Discovery');

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
                    this.logger.log('No Routes Found');
                    return Promise.resolve();
                }
            })
            .catch((e) => console.log(e));
    }
}