import {ValidationErrors, ValidatorFn} from "./types";
import {isEmptyInputValue} from "./utils";

export const Validators = {
    required(value: any): ValidationErrors | null {
        if (isEmptyInputValue(value) || value === '') {
            return { 'required': 'Aquest camp és requerit.' }
        }

        return null;
    },
    min(n: number): ValidatorFn {
        return (value: any): ValidationErrors | null => {
            if (!isNaN(value) && value >= n) {
                return null;
            }

            return { 'min': `El valor introduit no pot ser inferior a ${n}.`};
        }
    },
    max(n: number): ValidatorFn {
        return (value: any): ValidationErrors | null => {
            if (!isNaN(value) && value <= n) {
                return null;
            }

            return { 'max': `El valor introduit no pot superar ${n}.`};
        }
    },
    range(min, max): ValidatorFn {
        return (value: any): ValidationErrors | null => {
            if (!value || value >= min && value <= max) {
                return null;
            }

            return { 'range': `El valor d'aquest camp no es troba en el següent interval (${min}, ${max}).`};
        }
    },
    format(expression: RegExp): ValidatorFn {
        return (value: any): ValidationErrors | null => {
            if (!value || expression.test(value)) {
                return null;
            }

            return {'expression': `El valor d'aquest camp no té un format correcte.`};
        }
    }
}


