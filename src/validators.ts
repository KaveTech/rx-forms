import {ValidatorFn} from "./types";
import {isEmptyInputValue} from "./utils";

export const Validators = {
    required: [
      'required',
      (value: any): string | null => {
        if (isEmptyInputValue(value) || value === '') {
            return 'required';
        }

        return null;
      }
    ] as ValidatorFn,
    min(n: number): ValidatorFn {
      return [
        'min',
        (value: any): string | null => {
          if (!isNaN(value) && value >= n) {
              return null;
          }

          return 'min';
        }
      ]
    },
    max(n: number): ValidatorFn {
      return [
        'max',
        (value: any): string | null => {
          if (!isNaN(value) && value <= n) {
              return null;
          }

          return 'max';
        }
      ]
    },
    range(min: number, max: number): ValidatorFn {
      return [
        'range',
        (value: any): string | null => {
          if (!value || value >= min && value <= max) {
              return null;
          }

          return 'range';
        }
      ]
    },
    format(expression: RegExp): ValidatorFn {
      return [
        'format',
        (value: any): string | null => {
          if (!value || expression.test(value)) {
              return null;
          }

          return 'format';
        }
        ]
    }
}


