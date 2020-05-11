declare module 'blinkstick' {
    export enum BlinkStickProMode {
        normal = 0,
        inverse = 1,
        WS2812 = 2,
    }

    export interface BlinkStick {
        setMode(mode: BlinkStickProMode): void;
        setInverse(inverse: boolean): void;
    }

    export function findFirst(): BlinkStick;
    export function findAll(): BlinkStick[];
    export function findAllSerials(callback: (serials: number[]) => void): void;
    export function findBySerial(serial: number, callback: (device?: BlinkStick) => void): void;
}
