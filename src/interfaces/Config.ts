import { BlinkStickProMode } from 'blinkstick';
import { IClientOptions } from 'mqtt';

export default interface Config {
    mode?: BlinkStickProMode;
    inverse?: true;
    mqtt_connect_url: string;
    mqtt_connect_options?: IClientOptions;
    mqtt_topic_state: string;
    mqtt_topic_command: string;
}
