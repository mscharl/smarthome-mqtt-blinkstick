import { IClientOptions } from 'mqtt';
import { BlinkstickProMode } from './BlickstickProMode';

export default interface Config {
    mode?: BlinkstickProMode;
    inverse?: true;
    mqtt_connect_url: string;
    mqtt_connect_options?: IClientOptions;
    mqtt_topic_state: string;
    mqtt_topic_command: string;
}
