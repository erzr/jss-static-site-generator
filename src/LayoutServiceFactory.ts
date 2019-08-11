import ConnectedLayoutService from './connected/ConnectedLayoutService';
import DisconnectedLayoutService from './disconnected/DisconnectedLayoutService';
import GeneratorConfig from './GeneratorConfig';
import { GeneratorLogger } from './logging/GeneratorLogger';

export default class LayoutServiceFactory {

    build(config: GeneratorConfig, logger: GeneratorLogger) {
        if (config.IS_DISCONNECTED) {
            logger.log('Building Disconnected Layout Service');
            return new DisconnectedLayoutService(logger);
        }

        logger.log('Building Connected Layout Service');
        return new ConnectedLayoutService(config.PROXY_URL, config.API_KEY, config.APP_NAME, config.fetch, logger);
    }

}