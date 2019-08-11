import GeneratorConfig from "./GeneratorConfig";
import DisconnectedMediaFinder from "./disconnected/DisconnectedMediaFinder";
import MediaFinder from "./MediaFinder";
import ConnectedMediaFinder from "./connected/ConnectedMediaFinder";
import FileSystemUtilities from "./FileSystemUtilities";
import { GeneratorLogger } from "./logging/GeneratorLogger";

export default class MediaFinderFactory {

    build(config: GeneratorConfig, fileSystemUtilities: FileSystemUtilities, logger: GeneratorLogger) : MediaFinder {
        if (config.IS_DISCONNECTED) {
            logger.log('Building Disconnected Media Finder');
            return new DisconnectedMediaFinder(config, fileSystemUtilities);
        }

        logger.log('Building Connected Media Finder');
        return new ConnectedMediaFinder(config, fileSystemUtilities);
    }

}