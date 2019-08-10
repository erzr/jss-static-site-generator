import MediaFinder from "../MediaFinder";
import GeneratorConfig from "../GeneratorConfig";
import FileSystemUtilities from "../FileSystemUtilities";

export default class DisconnectedMediaFinder implements MediaFinder {

    private readonly config: GeneratorConfig;
    private readonly fileSystemUtilities: FileSystemUtilities;

    constructor(config: GeneratorConfig, fileSystemUtilities: FileSystemUtilities) {
        if (!config) {
            throw 'config';
        }

        if (!fileSystemUtilities) {
            throw 'fileSystemUtilities';
        }

        this.config = config;
        this.fileSystemUtilities = fileSystemUtilities;
    }

    copyMedia(): Promise<any> {
        this.fileSystemUtilities.copyFolderSync(`.${this.config.JSS_DISCONNECTED_MEDIA}`,
            `${this.config.BUILD_DIRECTORY}${this.config.JSS_DISCONNECTED_MEDIA}`);
        return Promise.resolve();
    }

}