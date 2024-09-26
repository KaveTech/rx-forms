# @kavehome/forms
Reactive Forms for your application 

# How to use

## Install

Then you can install the package using `npm` or `yarn`.

```bash
npm install @kavehome/forms
```

```bash
yarn add @kavehome/forms
```

## Usage

The `@kavehome/forms` library is an agnostic library, so it can be used with any framework or library, there have some examples of how to use it with `react`.

This is a simple example of how to use a form in a react functional component:

```tsx
import { useEffect, useRef, useState } from 'react';
import { FormFactory } from '@kavehome/forms';
import { RxControlGroup } from '@kavehome/forms/dist/types';

interface FormValues {
  name: string;
  email: string;
}

const FormExample = () => {
  const [formModel, setFormModel] = useState<FormValues| null>(null);
  const form = useRef<RxControlGroup<FormValues> | null>(null);

  useEffect(() => {
    // Create the form
    form.current = FormFactory.group<FormValues>({
      name: FormFactory.control(''),
      email: FormFactory.control(''),
    })

    // Set the form model
    setFormModel(form.current.value);
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.current!.isValid()) {
      // Do something with the form values
      console.log(form.current!.value);
    }
  }

  const refresh = () => {
    // Refresh the form model
    setFormModel(form.current!.value);
  }

  // We only render the form when the form model is ready
  if (!formModel) {
    return null;
  }

  return (<form onSubmit={handleSubmit} onChange={() => refresh()}>
      <input type="text" onChange={(e) => form.current!.get('name')!.value = e.target.value} />
      <input type="email" onChange={(e) => form.current!.get('email')!.value = e.target.value} />
      <button type="submit">Submit</button>
      <p>{JSON.stringify(formModel)}</p>
  </form>)
}
```

We can also use the `useForm` hook to create the form, and simplify the code.

```tsx
function useForm<T>(formGroup: RxControlGroup<T>): [
  RxControlGroup<T> | null,
  T | null,
  (form: RxControlGroup<T> | undefined) => void
] {
  const [model, setModel] = useState<T | null>(null);
  const formRef: MutableRefObject<RxControlGroup<T> | null> = useRef<RxControlGroup<T>>(null);

  useLayoutEffect(() => {
    if(!formGroup || formRef.current === formGroup) return;
    formRef.current = formGroup;
    setModel(formRef.current.value);
  }, [formGroup]);

  const onFormChange = (form: RxControlGroup<T> | undefined) => {
    // add a debounce to avoid multiple renders
    if(form) setModel(form.value);
  }

  return [ formRef.current, model, onFormChange ];
}
```

So the previous example can be simplified to:

```tsx
import { useEffect, useRef, useState } from 'react';
import { FormFactory } from '@kavehome/forms';
import { RxControlGroup } from '@kavehome/forms/dist/types';
import { useForm } from '.../useForm';

interface FormValues {
  name: string;
  email: string;
}

function FormExample() {
  const initForm = useMemo(() => FormFactory.group<FormValues>({
    name: FormFactory.control(''),
    email: FormFactory.control(''),
  }), []);
  const [form, model, onFormChange] = useForm<FormValues>(initForm);

  if (!form) {
    return null;
  }

  return (<form onChange={() => onFormChange(form)}>
      <input type="text" onChange={(e) => form!.get('name')!.value = e.target.value} />
      <input type="email" onChange={(e) => form!.get('email')!.value = e.target.value} />
      <button type="submit">Submit</button>
      <p>{JSON.stringify(model)}</p>
  </form>)
}
```

### FormFactory.group

The `FormFactory.group` method takes an object with a key-value pair of `string` and `RxFormControl` or `RxFormControl[]` or other `RxControlGroup` as the value.

```typescript
FormFactory.group({
  name: FormFactory.control(''),
  email: FormFactory.control(''),
  pet: FormFactory.group({
    name: FormFactory.control(''),
  }),
})
```

We can access the controls using the `get` method.

```typescript
const form = FormFactory.group({
  name: FormFactory.control(''),
  email: FormFactory.control(''),
  pet: FormFactory.group({
    name: FormFactory.control(''),
  }),
})

// acces to the name control
console.log(form.get('name'))
// acces to the value of the name control
console.log(form.get('name').value)
// check if the name control is valid
console.log(form.get('name').isValid())
```

### FormFactory.control

The `FormFactory.control` method takes an initial value and an array of validators.

```typescript
FormFactory.control('', [Validators.required])
```

### FormFactory.array

The `FormFactory.array` method takes an array of `RxFormControl` as the value.

```typescript
FormFactory.array([
  FormFactory.control(''),
  FormFactory.control(''),
])
```

### Validators

The `Validators` class contains a set of validators that can be used with the `FormFactory.control` method.

These are the available validators:

- `required`
- `min`
- `max`
- `range`
- `format`

```typescript
import { Validators } from '@kavehome/forms';

FormFactory.control('', [Validators.required])
```

We can also create our own custom validators, a validator is a function that takes a value and returns a object if the value is invalid or null if the value is valid.

```typescript
import { Validators } from '@kavehome/forms';

const customValidator = (value: string) : {fooError: string} | null => {
  if (value === 'foo') {
    return {
        fooError: 'Value cannot be foo';
    }
  }

  return null;
}

FormFactory.control('', [customValidator])
```

When a control is invalid, the `errors` property will contain an object with the errors.

```typescript
const form = FormFactory.group({
  name: FormFactory.control('', [Validators.required]),
})

console.log(form.get('name').errors)
```
