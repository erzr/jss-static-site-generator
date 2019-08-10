import GeneratorConfig from "./GeneratorConfig";
import DisconnectedMediaFinder from "./disconnected/DisconnectedMediaFinder";
import MediaFinder from "./MediaFinder";
import ConnectedMediaFinder from "./connected/ConnectedMediaFinder";
import FileSystemUtilities from "./FileSystemUtilities";

export default class MediaFinderFactory {

    build(config: GeneratorConfig, fileSystemUtilities: FileSystemUtilities) : MediaFinder {
        if (config.IS_DISCONNECTED) {
            return new DisconnectedMediaFinder(config, fileSystemUtilities);
        }

        return new ConnectedMediaFinder(config, fileSystemUtilities);
    }

}