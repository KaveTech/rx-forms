/*
find<T = any>(predicate: (obj: T) => boolean): RXAbstractControl {
    return this.controls.find(control => predicate(control.value as T));
}

findIndex<T = any>(predicate: (obj: T) => boolean): number {
    return this.controls.findIndex(control => predicate(control.value as T));
}

findByUUID(uuid: number): RXAbstractControl {
    return this.controls.find(control => control.UUID === uuid);
}

findIndexByUUID(uuid: number): number {
    return this.controls.findIndex(control => control.UUID === uuid);
}

removeAt(index: number): RXAbstractControl {
    const control: RXAbstractControl = this.controls.splice(index, 1).pop();
    this.updateValueAndValidity();

    return control;
}

replaceAt(index: number, control: RXAbstractControl): RXAbstractControl {
    (control.parent as {parent: RXAbstractControlGroup}) = this;
    const replaced: RXAbstractControl = this.controls.splice(index, 1, control).pop();
    this.updateValueAndValidity();

    return replaced;
}

last(): RXAbstractControl {
    return this.controls[this.controls.length - 1];
}*/

import type {RxFormControl} from "./types";

export const find = (key) => (controls: Array<[any, RxFormControl]>) => [ controls.find(([k, _]) => k === key) ];

export const tap = (callback) => (controls: Array<[any, RxFormControl]>) => {
    callback(controls);
    return controls;
};

export const map = (callback) => (controls: Array<[any, RxFormControl]>) => controls.map(callback);
