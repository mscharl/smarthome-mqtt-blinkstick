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

        if (
            this.config.mode === BlinkstickProMode.normal ||
            this.config.mode === BlinkstickProMode.inverse ||
            this.config.mode === BlinkstickProMode.WS2812
        ) {
            this.blinkStick.setMode(this.config.mode);
        }

        if (this.config.inverse === true) {
            this.blinkStick.setInverse(this.config.inverse);
        }

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
        });
    }

    @bind private onMqttMessage(topic: string, message: string): void {
        const payload: MqttPayload = JSON.parse(message);

        if (payload.state === 'OFF') {
            this.blinkStick.morph(0, 0, 0, { duration: 1000 }, () => {
                this.blinkStick.turnOff();
                this.publishCurrentState();
            });
        } else if (payload.color?.r && payload.color?.g && payload.color?.b) {
            const { r, g, b } = payload.color;

            this.blinkStick.morph(r, g, b, { duration: 500 }, () => {
                this.publishCurrentState();
            });
        }
    }

    private getCurrentState(): Promise<MqttPayload> {
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.blinkStick.getColor((error: any, red: number, green: number, blue: number): void => {
                if (error) {
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
        const payload = JSON.stringify(this.getCurrentState());

        this.mqttClient.publish(this.config.mqtt_topic_state, payload);
    }
}
