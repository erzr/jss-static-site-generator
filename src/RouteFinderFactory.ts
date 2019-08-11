import DisconnectedRouteFinder from './disconnected/DisconnectedRouteFinder';
import ConnectedRouteFinder from './connected/ConnectedRouteFinder';
import GeneratorConfig from './GeneratorConfig';
import RouteFinder from './RouteFinder';
import { GeneratorLogger } from './logging/GeneratorLogger';

export default class RouteFinderFactory {

    build(config: GeneratorConfig, logger: GeneratorLogger) : RouteFinder {
        if (config.IS_DISCONNECTED) {
            logger.log('Building Disconnected Route Finder');
            return new DisconnectedRouteFinder(config.LANGUAGE, config.ROUTE_PATH);
        }

        logger.log('Building Connected Route Finder');
        return new ConnectedRouteFinder(config);
    }

}