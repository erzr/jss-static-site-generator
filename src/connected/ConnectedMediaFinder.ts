import MediaFinder from "../MediaFinder";
import GeneratorConfig from "../GeneratorConfig";
import RecursiveItemFinder from "./RecursiveItemFinder";
import { MediaQuery } from "./queries";
import FileSystemUtilities from "../FileSystemUtilities";
import WebUtilities from "../WebUtilities";

interface ConnectedMediaItem {
    child: {
        url: string;
        extension: {
            value: string;
        };
    };
}

export default class ConnectedMediaFinder implements MediaFinder {

    private readonly config: GeneratorConfig;
    private readonly fileSystemUtilities: FileSystemUtilities;
    private readonly webUtilities: WebUtilities;
    private readonly recursiveItemFinder: RecursiveItemFinder;

    constructor(config: GeneratorConfig, fileSystemUtilities: FileSystemUtilities, 
        webUtilities?: WebUtilities, recursiveItemFinder?: RecursiveItemFinder) {
        if (!config) {
            throw 'config';
        }

        if (!fileSystemUtilities) {
            throw 'fileSystemUtilities';
        }

        this.config = config;
        this.fileSystemUtilities = fileSystemUtilities;
        this.webUtilities = webUtilities || new WebUtilities(config);
        this.recursiveItemFinder = recursiveItemFinder || new RecursiveItemFinder(this.config);
    }

    findMedia(path: string): Promise<any> {
        return this.recursiveItemFinder.find(MediaQuery, path, (child) => child.extension);
    }

    copyMedia(): Promise<any> {
        return this.findMedia(this.config.MEDIA_SITECORE_PATH)
            .then(media => this.handleFindMediaResponse(media));
    }

    handleFindMediaResponse(media: any) {
        const allPromises = media.map((mediaItem: ConnectedMediaItem) => this.handleFindMediaResponseItem(mediaItem))
        return Promise.all(allPromises);
    }

    async handleFindMediaResponseItem(mediaItem: ConnectedMediaItem) {
        const cleanUrl = this.cleanMediaUrl(mediaItem),
            path = `${this.config.BUILD_DIRECTORY}${cleanUrl}`,
            pathWithoutFile = path.substring(0, path.lastIndexOf("/"));

        this.fileSystemUtilities.ensureDirectoryExists(pathWithoutFile);

        return this.webUtilities.downloadFile(this.config.LAYOUT_SERVICE_HOST + mediaItem.child.url, path);
    }

    cleanMediaUrl(item: ConnectedMediaItem) {
        return item.child.url
            .replace(`${this.config.MEDIA_PREIX}/${this.config.APP_NAME}`, '')
            .replace('.ashx', `.${item.child.extension.value}`);
    }
}