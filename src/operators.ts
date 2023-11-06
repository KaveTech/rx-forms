import type {RxFormControl} from "./types";

export const find = (key) => (controls: Array<[any, RxFormControl]>) => [ controls.find(([k, _]) => k === key) ];

export const tap = (callback) => (controls: Array<[any, RxFormControl]>) => {
    callback(controls);
    return controls;
};

export const map = (callback) => (controls: Array<[any, RxFormControl]>) => controls.map(callback);
