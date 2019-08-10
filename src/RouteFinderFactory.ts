import DisconnectedRouteFinder from './disconnected/DisconnectedRouteFinder';
import ConnectedRouteFinder from './connected/ConnectedRouteFinder';
import GeneratorConfig from './GeneratorConfig';
import RouteFinder from './RouteFinder';

export default class RouteFinderFactory {

    build(config: GeneratorConfig) : RouteFinder {
        if (config.IS_DISCONNECTED) {
            return new DisconnectedRouteFinder(config.LANGUAGE, config.ROUTE_PATH);
        }

        return new ConnectedRouteFinder(config);
    }

}