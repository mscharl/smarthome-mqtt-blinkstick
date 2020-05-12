export default interface MqttPayload {
    state: 'ON' | 'OFF';
    color?: {
        r: number;
        g: number;
        b: number;
    };
}
