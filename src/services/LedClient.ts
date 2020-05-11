import bind from 'bind-decorator';
import { BlinkStick, BlinkStickProMode } from 'blinkstick';
import mqtt, { MqttClient } from 'mqtt';
import Config from '../interfaces/Config';

export default class LedClient {
    private blinkStick: BlinkStick;
    private config: Config;
    private mqttClient: MqttClient;

    public constructor(blinkStick: BlinkStick, config: Config) {
        this.blinkStick = blinkStick;
        this.config = config;

        if (
            this.config.mode === BlinkStickProMode.normal ||
            this.config.mode === BlinkStickProMode.inverse ||
            this.config.mode === BlinkStickProMode.WS2812
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

            // TODO: Publish status
        });
    }

    @bind private onMqttMessage(topic: string, message: string): void {
        const payload = JSON.parse(message);

        console.log(payload);
    }
}
