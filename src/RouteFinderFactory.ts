import DisconnectedRouteFinder from './disconnected/DisconnectedRouteFinder';
import ConnectedRouteFinder from './connected/ConnectedRouteFinder';
import GeneratorConfig from './GeneratorConfig';

export default class RouteFinderFactory {

    build(config: GeneratorConfig) {
        if (config.IS_DISCONNECTED) {
            return new DisconnectedRouteFinder(config.LANGUAGE);
        }

        return new ConnectedRouteFinder(config);
    }

}