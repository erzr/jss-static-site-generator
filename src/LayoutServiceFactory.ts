import ConnectedLayoutService from './connected/ConnectedLayoutService';
import DisconnectedLayoutService from './disconnected/DisconnectedLayoutService';
import GeneratorConfig from './GeneratorConfig';

export default class LayoutServiceFactory {

    build(config: GeneratorConfig) {
        if (config.IS_DISCONNECTED) {
            return new DisconnectedLayoutService();
        }

        return new ConnectedLayoutService(config.PROXY_URL, config.API_KEY, config.APP_NAME, config.fetch);
    }

}