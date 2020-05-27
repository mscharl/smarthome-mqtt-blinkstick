import bind from 'bind-decorator';
import { BlinkStick } from 'blinkstick';
import mqtt, { MqttClient } from 'mqtt';
import { BlinkstickProMode } from '../interfaces/BlickstickProMode';
import Config from '../interfaces/Config';
import MqttPayload from '../interfaces/MqttPayload';

export default class LedClient {
    private blinkStick: BlinkStick;
    private config: Config;
    private mqttClient: MqttClient;

    public constructor(blinkStick: BlinkStick, config: Config) {
        this.blinkStick = blinkStick;
        this.config = config;

        console.log('Starting blinkstick');

        if (
            this.config.mode === BlinkstickProMode.normal ||
            this.config.mode === BlinkstickProMode.inverse ||
            this.config.mode === BlinkstickProMode.WS2812
        ) {
            console.log('Setting mode %o', BlinkstickProMode[this.config.mode]);
            this.blinkStick.setMode(this.config.mode);
        }

        if (this.config.inverse === true) {
            console.log('Setting inverse %o', this.config.inverse);
            this.blinkStick.setInverse(this.config.inverse);
        }

        console.log('Connecting to MQTT Broker');
        this.mqttClient = mqtt.connect(this.config.mqtt_connect_url, this.config.mqtt_connect_options);
        this.mqttClient.on('connect', this.onMqttConnect);
        this.mqttClient.on('message', this.onMqttMessage);
    }

    @bind private onMqttConnect(): void {
        this.mqttClient.subscribe(this.config.mqtt_topic_command, (error) => {
            if (error) {
                console.error(error);
                return;
            }

            console.log('Connected');
            this.runLightInit();
        });
    }

    @bind private onMqttMessage(topic: string, message: string): void {
        const payload: MqttPayload = JSON.parse(message);

        console.log('Received message %o', payload);

        if (payload.state === 'OFF') {
            console.log('Turn off');

            this.blinkStick.morph(0, 0, 0, { duration: 1000 }, () => {
                this.blinkStick.turnOff();
                this.publishCurrentState();
            });
        } else if (!payload.color) {
            console.log('Turn on');

            this.blinkStick.morph(255, 128, 0, { duration: 1000 }, () => {
                this.publishCurrentState();
            });
        } else {
            const { r, g, b } = payload.color;

            console.log('Morph into rgb(%o,%o,%o)', r, g, b);

            this.blinkStick.morph(r, g, b, { duration: 2000 }, () => {
                this.publishCurrentState();
            });
        }
    }

    private getCurrentState(): Promise<MqttPayload> {
        return new Promise((resolve, reject) => {
            console.log('Fetching state');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.blinkStick.getColor((error: any, red: number, green: number, blue: number): void => {
                if (error) {
                    console.error(error);
                    return reject(error);
                }

                if (red === 0 && green === 0 && blue === 0) {
                    return resolve({
                        state: 'OFF',
                    });
                }

                return resolve({
                    state: 'ON',
                    color: {
                        r: red,
                        g: green,
                        b: blue,
                    },
                });
            });
        });
    }

    private publishCurrentState(): void {
        this.getCurrentState().then((state) => {
            console.log('Publishing state %o', state);

            const payload = JSON.stringify(state);

            this.mqttClient.publish(this.config.mqtt_topic_state, payload);
        });
    }

    private runLightInit(): void {
        [0, 1]
            .reduce(
                (previousOuterPromise) =>
                    previousOuterPromise.then(() => {
                        return [
                            [255, 0, 0],
                            [0, 255, 0],
                            [0, 0, 255],
                        ].reduce(
                            (previousInnerPromise, [r, g, b]) =>
                                previousInnerPromise.then(
                                    () =>
                                        new Promise((resolve) => {
                                            this.blinkStick.setColor(r, g, b, {}, () => {
                                                setTimeout(resolve, 180);
                                            });
                                        })
                                ),
                            Promise.resolve()
                        );
                    }),
                Promise.resolve()
            )
            .then(() => {
                this.blinkStick.turnOff();
                this.publishCurrentState();
            });
    }
}
