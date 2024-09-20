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
    WithStateFn,
    WithStatus,
    WithUUID,
    WithValidation,
    WithValue,
    WithValueFn,
    WithValueFnProps,
    WithValueGetter,
    WithValueSetter
} from "./types";
import {isValidatorFunction, lazyDeepCopy, mixin, parseControls, pipe} from "./utils";

/***
 * ===== WithUUID =====
 */

const withUUID: Mixin<WithUUID> = obj => {
    const isWindow = typeof window !== 'undefined'
    
    const getRandomValues = (arr: Uint8Array): Uint8Array => arr.fill(Math.random() * 256 | 0);

    if(isWindow){
        const crypto = window['crypto'] || window['msCrypto'] || {};
        crypto.getRandomValues = crypto.getRandomValues || getRandomValues;
    }

    // @ts-ignore
    const generateUUID = (): string => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c: number) =>
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

const withValidation: (validators: ValidatorFn | ValidatorFn[]) => Mixin<WithValidation> = (validators = []) => obj => {
  // Failsafe in case validators is null.
  validators = validators || [];

  let _validators: ValidatorFn[] = isValidatorFunction(validators) ?
      [validators as ValidatorFn] as ValidatorFn[] :
      validators as ValidatorFn[];

  const hasValidator = (validator: ValidatorFn): boolean => {
    return _validators.some(v => v[0] === validator[0]);
  }

  return mixin(obj, {
      errors: [],
      addValidator(...newValidator: ValidatorFn[]): void {
        _validators = [
          ..._validators,
          ...newValidator.filter(v => !hasValidator(v))
        ];
      },
      removeValidator(key: string): void {
        const index = _validators.findIndex(v => v[0] === key);
        if (index > -1) {
          _validators.splice(index, 1);
        }
      },
      validate(value: any): void {
        if (this.isDisabled()) {
          return;
        }

        this.errors = _validators.reduce((res, [, validator]) => {
          const error = validator(value);
          if (error) {
            res = [...res, error];
          }

          return res;
        }, []);
      }
  });
}

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
 * ===== WithState =====
 */

const withState: WithStateFn = (
    validators: ValidatorFn | ValidatorFn[],
    predicate: (obj: any) => FormStatus,
    valueProps: WithValueFnProps
) => (obj) => {

    const base: typeof obj
      & WithValidation
      & WithParent
      & WithStatus
      & WithValue = pipe(
        withParent,
        withStatus,
        withValidation(validators),
        withValue(valueProps)
    )(obj);

    let _pristine: boolean = true;
    let _touched: boolean = false;

    return mixin(base, {
        get pristine(): boolean {
            return _pristine;
        },
        get touched(): boolean {
            return _touched;
        },
        // @deprecated - Use setTouched
        set touched(value: boolean) {
          _touched = value;
        },
        setTouched(value: boolean, propagate: boolean = true) {
            const changed = value !== _touched;
            _touched = value;

            if (propagate && changed) {
              this.updateState(this.value);
            }
        },
        updateState(value: any) {
            if (!this.isDisabled()) {
              this.validate(value);
              this.updateStatus(predicate);
            }

            if (this.parent) {
                (this.parent as WithState).updateState(this.parent.value);
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
                ...assignParent(this, parseControls<T>(controls, _controls.size))
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
    validators: ValidatorFn | ValidatorFn[] | undefined;
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
        withState<T>(
          validators,
          calculateStatus,
          {value, getter, setter}
        )
    )({});

    if (!controls) {
        return obj as RxFormControl<T>;
    }

    return withControls(parseControls<T>(controls))(obj) as RxControlGroup<T>;
};
