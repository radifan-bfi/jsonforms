export type FormBuilderMetadata = {
  title: string;
  description: string;
  schema: string;
};

export type FormBuilderConfig = {
  persistData?: boolean;
};

export type StepComponent = {
  componentType: "step";
  title: string;
  components: FormBuilderComponent[];
};

export type SectionComponent = {
  componentType: "section";
  title?: string;
  description?: string;
  components: FormBuilderComponent[];
};

export type GridComponent = {
  componentType: "grid";
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  components: FormBuilderComponent[];
};

export type FieldCondition = {
  field: string; // The field path to watch
  operator: "equals" | "notEquals" | "exists" | "notExists";
  value?: string | number | boolean; // Value to compare for equals/notEquals
};

export type BaseFieldComponent = {
  componentType: "field";
  jsonSchemaPropertyPath: string;
  inputProps: BaseInputProps;
  conditions?: {
    show?: FieldCondition[];
  };
};

export type BaseInputProps = {
  title: string;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  className?: string;
};

export type TextFieldComponent = BaseFieldComponent & {
  inputType: "text";
};

export type NumberFieldComponent = BaseFieldComponent & {
  inputType: "number";
};

export type SelectFieldComponent = BaseFieldComponent & {
  inputType: "select";
};

export type DateFieldComponent = BaseFieldComponent & {
  inputType: "date";
};

export type PasswordFieldComponent = BaseFieldComponent & {
  inputType: "password";
};

export type PhoneFieldComponent = BaseFieldComponent & {
  inputType: "phone";
};

export type FieldComponent =
  | TextFieldComponent
  | NumberFieldComponent
  | SelectFieldComponent
  | DateFieldComponent
  | PasswordFieldComponent
  | PhoneFieldComponent;

export type FormBuilderComponent =
  | SectionComponent
  | GridComponent
  | FieldComponent;

export type FormBuilder = {
  version: string;
  metadata: FormBuilderMetadata;
  components: (StepComponent | FormBuilderComponent)[];
  config?: FormBuilderConfig;
};
