import GeneratorConfig from "./GeneratorConfig";

export default interface LayoutService {
    fetchLayoutData(route: string, language: string) : Promise<any>;
    fetchDictionary(language: string) : Promise<any>
    start(config:GeneratorConfig) : Promise<any>;
}