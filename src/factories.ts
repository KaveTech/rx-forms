import type {
    FormArray,
    FormModel,
    RxControlGroup,
    RxFormControl,
    ValidatorFn,
    WithValueGetter,
    WithValueSetter
} from "./types";
import {createGenericControl, FormStatus} from "./mixins";
import {toArray, toObject} from "./utils"

const createControl = <T = any>(value: T, validators?: ValidatorFn | ValidatorFn[]): RxFormControl<T> => {
    const calculateStatus = (obj: RxFormControl<T>) => {
        if (obj.errors) {
            return FormStatus.INVALID;
        }

        return FormStatus.VALID;
    }

    const setter: WithValueSetter<T> = (control: RxFormControl<T>, value: T, current: T) => {
        if (control.isDisabled()) {
            return current;
        }

        if (control.pristine) {
            control.setDirty();
        }

        control.updateState(value);

        return value;
    }

    const control = createGenericControl<T, never>({
        value,
        validators,
        calculateStatus,
        setter
    });

    control.updateState(control.value);

    return control;
};

const createGroup = <T, CT>(
    controls: CT,
    validators?: ValidatorFn | ValidatorFn[],
    parser?: (controls: [k: keyof T, v: RxFormControl][]) => any
): RxControlGroup<T> => {
    const calculateStatus = (group: RxControlGroup<T>) => {
        if (group.controls.every(([_, control]) => control.isDisabled())) {
            return FormStatus.DISABLED;
        }

        if (group.controls.some(([_, control]) => control.isInvalid())) {
            return FormStatus.INVALID;
        }

        return FormStatus.VALID;
    }

    const getter: WithValueGetter = (control: RxControlGroup<T>) => {
        if (parser) {
            return parser(control.controls);
        }

        return null;
    };

    let group = createGenericControl<T, CT>({
        value: null,
        getter,
        validators,
        calculateStatus,
        controls
    }) as RxControlGroup<T>;

    group.updateState(group.value);

    return group;
};

export const FormFactory = {
    control<T = any>(value: T, validators?: ValidatorFn | ValidatorFn[]): RxFormControl<T> {
        return createControl(value, validators);
    },
    group<T = any>(controls: FormModel<T>, validators?: ValidatorFn | ValidatorFn[]): RxControlGroup<T> {
        return createGroup(controls, validators, toObject);
    },
    array<T = any>(controls: FormArray<T>): RxControlGroup<T[]> {
        return createGroup<T[], FormArray<T>>(controls, null, toArray);
    }
}
