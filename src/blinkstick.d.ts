/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'blinkstick' {
    export interface MorphOptions {
        channel?: number;
        index?: number;
        duration?: number;
        steps?: number;
    }

    export interface BlinkStick {
        setMode(mode: 0 | 1 | 2): void;
        setInverse(inverse: boolean): void;
        getColor(callback: (error: any, red: number, green: number, blue: number) => void): void;
        getColor(index: number, callback: (error: any, red: number, green: number, blue: number) => void): void;
        morph(color: string, options?: MorphOptions, callback?: () => void): void;
        morph(red: number, green: number, blue: number, options?: MorphOptions, callback?: () => void): void;
        turnOff(): void;
    }

    export function findFirst(): BlinkStick;
    export function findAll(): BlinkStick[];
    export function findAllSerials(callback: (serials: number[]) => void): void;
    export function findBySerial(serial: number, callback: (device?: BlinkStick) => void): void;
}
