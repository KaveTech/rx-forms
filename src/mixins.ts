import type {
    ControlMap,
    FormArray,
    FormModel,
    Mixin,
    RxControlGroup,
    RxFormControl,
    ValidatorFn,
    WithControls,
    WithParent,
    WithState,
    WithStatus,
    WithUUID,
    WithValidation,
    WithValueFn,
    WithValueGetter,
    WithValueSetter
} from "./types";
import {coerceToValidator, lazyDeepCopy, mixin, parseControls, pipe} from "./utils";


/***
 * ===== WithUUID =====
 */

const withUUID: Mixin<WithUUID> = obj => {
    const getRandomValues = (arr: Uint8Array): Uint8Array => arr.fill(Math.random() * 256 | 0);

    const crypto = window['crypto'] || window['msCrypto'] || {};
    crypto.getRandomValues = crypto.getRandomValues || getRandomValues;

    // @ts-ignore
    const generateUUID = (): string => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );

    return mixin(obj, {
        UUID: generateUUID()
    });
};

/***
 * ===== WithStatus =====
 */

export enum FormStatus {
    VALID = 'valid',
    INVALID = 'invalid',
    DISABLED = 'disabled'
}

const withStatus: Mixin<WithStatus> = obj => {
    let _status = FormStatus.INVALID;

    return mixin(obj, {
        get status() {
            return _status
        },
        isDisabled(): boolean {
            return this.status === FormStatus.DISABLED;
        },
        isValid(): boolean {
            return this.status === FormStatus.VALID;
        },
        isInvalid(): boolean {
            return this.status === FormStatus.INVALID;
        },
        updateStatus(predicate) {
            _status = predicate(this);
        }
    });
};

/***
 * ===== WithValidation =====
 */

const withValidation: (validator: ValidatorFn) => Mixin<WithValidation> = (validator) => obj => mixin(obj, {
    errors: null,
    validate(value): void {
        if (!validator) {
            return;
        }

        this.errors = validator(value)
    }
});

/***
 * ===== WithState =====
 */

const withState = (
    validator: ValidatorFn,
    predicate: (obj: any) => FormStatus
): Mixin<WithState & WithValidation & WithParent & WithStatus> => (obj) => {

    const base: typeof obj & WithValidation & WithParent & WithStatus = pipe(
        withParent,
        withStatus,
        withValidation(validator)
    )(obj);

    let _pristine: boolean = true;

    return mixin(base, {
        get pristine(): boolean {
            return _pristine;
        },
        updateState(value: any) {
            if (!this.isDisabled()) {
                this.validate(value);
                this.updateStatus(predicate);
            }

            if (this.parent) {
                (this.parent as WithState).updateState(value);
            }
        },
        setDirty() {
            _pristine = false;

            if (this.parent) {
                (this.parent as WithState).setDirty();
            }
        }
    }) as typeof base & WithState;
};

/***
 * ===== WithValue =====
 */

const withValue: WithValueFn = ({value, getter, setter}) => obj => {
    let _value: any = value;

    return mixin(obj, {
        get value() {
            if (getter) {
                return getter(this, _value);
            }

            return _value;
        },
        set value(v) {
            if (setter) {
                _value = setter(this, v, _value);
            }
        }
    })
};

/***
 * ===== WithParent =====
 */

const withParent: Mixin<WithParent> = obj => mixin(obj, {
    parent: null
});

/***
 * ===== WithControls =====
 */

const withControls = <T = any>(controls: ControlMap<T, keyof T>): Mixin<WithControls<T>> => obj => {
    let _controls = new Map();

    const assignParent = (parent, controls: ControlMap<T, keyof T>) => {
        controls.forEach((control) => control.parent = parent);
        return controls;
    }

    const parent: typeof obj & WithControls<T> = mixin(obj, {
        get controls() {
            return Array.from(_controls.entries());
        },
        get(key) {
            return _controls.get(key);
        },
        addControl(controls) {
            _controls = new Map([
                ..._controls,
                ...assignParent(this, parseControls<T>(controls))
            ]);
        },
        pipe(...functors) {
            return functors.reduce((x, f) => f(x), lazyDeepCopy(this.controls));
        }
    });

    _controls = assignParent(parent, controls);

    return parent;
};

/***
 * ===== Control factories =====
 */

interface CreateControlParams<T, CT = FormModel<T> | FormArray<T>> {
    value: T;
    validators: ValidatorFn | ValidatorFn[];
    calculateStatus: (obj: any) => FormStatus;
    getter?: WithValueGetter<T>;
    setter?: WithValueSetter<T>;
    controls?: CT;
}
export const createGenericControl = <T, CT>({
    value,
    validators,
    calculateStatus,
    getter,
    setter,
    controls
}: CreateControlParams<T, CT>): RxFormControl<T> | RxControlGroup<T> => {

    let obj = pipe(
        withUUID,
        withValue<T>({value, getter, setter}),
        withState(coerceToValidator(validators), calculateStatus)
    )({});

    if (!controls) {
        return obj as RxFormControl<T>;
    }

    return withControls(parseControls<T>(controls))(obj) as RxControlGroup<T>;
};
