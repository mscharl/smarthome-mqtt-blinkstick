import fs from 'fs';
import blinkstick from 'blinkstick';
import Config from './interfaces/Config';
import LedClient from './services/LedClient';

const defaultConfigPromise = new Promise<string>((resolve, reject) => {
    fs.readFile(__dirname + '/../config/default.json', (error, data) => {
        if (error) {
            reject(error);
        }

        resolve(data.toString());
    });
});

const configPromises = [defaultConfigPromise].map(
    (promise): Promise<Config> => promise.then((data: string) => JSON.parse(data))
);

Promise.all(configPromises)
    .then((configs) =>
        configs.reduce((combinedConfig, config) => ({
            ...combinedConfig,
            ...config,
        }))
    )
    .then((config) => {
        const LED = blinkstick.findFirst();

        if (!(LED ?? false)) {
            throw new Error('No blinkstick found');
        }

        new LedClient(LED, config);
    })
    .catch((error) => {
        console.error(error);
    });
