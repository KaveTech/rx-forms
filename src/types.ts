import {FormStatus} from "./mixins";

/***
 * ========================
 * =     HELPER TYPES     =
 * ========================
 */

export type ValidatorFn = (value: any) => ValidationErrors | null;

export type ValidationErrors = Record<string, any>;

export type Mixin<Y> = <X extends object>(a: X) => X & Y;

export type Reduce<A extends object, T extends unknown[]> = T extends [] ? A :
    T extends [Mixin<infer B>, ...infer C] ? Reduce<A & B, C> : never;

export type WithValueGetter<T = any> = (obj: any, value: T) => T;

export type WithValueSetter<T = any> = (obj: any, value: T, current: T) => T;

export type WithValueFn = <T = any>(props: {value: T, getter?: WithValueGetter<T>, setter?: WithValueSetter<T>}) =>
    Mixin<WithValue<T>>;

export type ControlMap<T, K extends keyof T> = Map<T, RxFormControl<T[K]>>;

export type ControlMapProp<T, K extends keyof T> = T extends any[] ? number : K;

// @ts-ignore - Added to cancel "ControlMapProp cannot be an index for type of T".
export type ConditionalReturnType<RT, T, K extends keyof T> = RT extends unknown ? RxFormControl<T[ControlMapProp<T, K>]> : RT;

/***
 * ========================
 * =     MIXIN TYPES      =
 * ========================
 */

export type WithUUID = { UUID: string };

export type WithStatus = {
    status: FormStatus,
    isDisabled: () => boolean,
    isValid: () => boolean,
    isInvalid: () => boolean,
    updateStatus(predicate: (obj: ThisType<WithStatus>) => FormStatus): void;
};

export type WithValidation = {
    errors: ValidationErrors | null,
    validate(value: any): void
};

export type WithState = {
    updateState(value: any): void,
    pristine: boolean,
    touched: boolean,
    setDirty(): void
};

export type WithValue<T = any> = { value: T };

export type WithParent = { parent: RxControlGroup | null };

export type WithControls<T> = {
    controls: Array<[keyof T, RxFormControl<T[keyof T]>]>;
    get<X extends unknown, K extends keyof T, RT extends ConditionalReturnType<X, T, K>>(key: ControlMapProp<T, K>): RT;
    get<RT>(key: ControlMapProp<T, keyof T>): RT;
    addControl(controls: FormModel<T> | FormArray<T>): void;
    pipe(...functors: ((controls: Array<[keyof T, RxFormControl<T[keyof T]>]>) =>
        Array<[keyof T, RxFormControl<T[keyof T]>]>
    )[]);
}

/***
 * ========================
 * =     OBJECT TYPES     =
 * ========================
 */

export type RxFormControl<T = any> = WithUUID & WithState & WithValidation & WithStatus & WithParent & WithValue<T> | null;
export type RxControlGroup<T = any> = WithControls<T> & RxFormControl;
export type FormModel<T> = { [K in keyof T]?: RxFormControl<T[K]> };
export type FormArray<T> =  T extends object ? RxControlGroup<T>[] : RxFormControl<T>[];
