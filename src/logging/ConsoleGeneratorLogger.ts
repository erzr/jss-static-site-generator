import { GeneratorLogger } from "./GeneratorLogger";

export default class ConsoleGeneratorLogger implements GeneratorLogger {
    constructor() {
        this.log('Building new logger...');
    }

    debug(message: any): void {
        console.log(message);
    }
    
    log(message: any): void {
        console.log(message);
    }

    error(message: any): void {
        console.error(message);
    }
}