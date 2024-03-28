import {
    ControlMap,
    Mixin,
    Reduce,
    RxFormControl,
} from "./types";

export const pipe = <T extends Mixin<unknown>[]>(...fns: T): <A extends object>(x: A) => Reduce<A, T> =>
    x => fns.reduce((y, f) => f(y), x) as Reduce<typeof x, T>;

export const mixin = <T>(target: any, ...sources: any[]): T => {
    sources.forEach(source => {
        let descriptors: PropertyDescriptorMap = Object.keys(source).reduce((descriptors, key) => ({
            ...descriptors,
            [key]: Object.getOwnPropertyDescriptor(source, key)
        }), {});

        Object.getOwnPropertySymbols(source).forEach(sym => {
            let descriptor = Object.getOwnPropertyDescriptor(source, sym);
            if (descriptor && descriptor.enumerable) {
                descriptors[sym] = descriptor;
            }
        });

        Object.defineProperties(target, descriptors);
    });

    return target as unknown as T;
}

export const isEmptyInputValue = (value: any): boolean => {
    return isUndefinedOrNull(value) || Number.isNaN(value) || value.length === 0;
}

export const isUndefinedOrNull = (value: any): boolean => {
    return value === null || value === undefined;
}

export const isValidatorFunction = (obj: any): boolean => {
  return Array.isArray(obj) &&
    obj.length === 2 &&
    typeof obj[0] === 'string' &&
    typeof obj[1] === 'function';
}

export const toObject = <T>(controls: [k: keyof T, v: RxFormControl<T>][]) =>
    controls.reduce((res, [k , v]) => ({ ...res, [k]: v.value }), {});

export const toArray = <T>(controls: [k: keyof T, v: RxFormControl<T>][]) =>
    controls.reduce((res, [_ , v]) => [...res, v.value], []);

export const parseControls = <T>(controls, currentLength: number = 0): ControlMap<T, keyof T> => {
    if (Array.isArray(controls)) {
        return new Map(controls.map((v, i) => [i + currentLength, v])) as unknown as ControlMap<T, keyof T>;
    }

    return new Map(
        Object.entries(controls)
    ) as unknown as ControlMap<T, keyof T>;
}

export const isProxiable = (v: any) => {
    return v !== null && typeof v !== 'function' && typeof v !== 'symbol' && typeof v === 'object';
}

/***
 * === NON PERFORMANT - USE WITH CAUTION ===
 */
export const lazyDeepCopy = (obj: any) => {
    const get = (target: any, property: string | symbol, receiver: any) => {
        if (!(property in target)) {
            return undefined;
        }

        let obj = Reflect.get(target, property, receiver);

        if (!isProxiable(obj)) {
            return obj;
        }

        if (Array.isArray(obj)) {
            obj = [...obj];
        } else {
            obj = {...obj};
        }

        return toProxy(obj);
    }

    function toProxy(obj: any) {
        return new Proxy(obj, { get });
    }

    return toProxy(obj);
}
