/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { get, set } from "lodash";
import Ajv2020 from "ajv/dist/2020";
import "./App.css";
import {
  FieldComponent,
  FormBuilder,
  FormBuilderComponent,
  GridComponent,
  SectionComponent,
  StepComponent,
} from "./types";
import { dataSchema, formBuilderSchema } from "./schema";

const Field: React.FC<{
  component: FieldComponent;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}> = ({ component, value, onChange, error }) => {
  const { inputProps, inputType } = component;

  switch (inputType) {
    case "text":
    case "phone":
      return (
        <div className="field">
          <label>{inputProps.title}</label>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={inputProps.placeholder}
            disabled={inputProps.disabled}
            className={inputProps.className}
          />
          {error && <span className="error">{error}</span>}
        </div>
      );

    case "number":
      return (
        <div className="field">
          <label>{inputProps.title}</label>
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={inputProps.placeholder}
            disabled={inputProps.disabled}
            className={inputProps.className}
          />
          {error && <span className="error">{error}</span>}
        </div>
      );

    case "select": {
      const countries = ["USA", "Canada", "UK", "Australia"];
      return (
        <div className="field">
          <label>{inputProps.title}</label>
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={inputProps.disabled}
            className={inputProps.className}
          >
            <option value="">Select {inputProps.title}</option>
            {countries.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {error && <span className="error">{error}</span>}
        </div>
      );
    }

    default:
      return null;
  }
};

const Grid: React.FC<{
  component: GridComponent;
  formData: any;
  onChange: (path: string, value: any) => void;
  errors: Record<string, string>;
}> = ({ component, formData, onChange, errors }) => {
  const columns = component.columns?.default || 1;

  return (
    <div className={`grid grid-cols-${columns}`}>
      {component.components.map((comp, index) => (
        <RenderComponent
          key={index}
          component={comp}
          formData={formData}
          onChange={onChange}
          errors={errors}
        />
      ))}
    </div>
  );
};

const Section: React.FC<{
  component: SectionComponent;
  formData: any;
  onChange: (path: string, value: any) => void;
  errors: Record<string, string>;
}> = ({ component, formData, onChange, errors }) => {
  return (
    <div className="section">
      {component.title && <h3>{component.title}</h3>}
      {component.description && <p>{component.description}</p>}
      {component.components.map((comp, index) => (
        <RenderComponent
          key={index}
          component={comp}
          formData={formData}
          onChange={onChange}
          errors={errors}
        />
      ))}
    </div>
  );
};

const RenderComponent: React.FC<{
  component: FormBuilderComponent;
  formData: any;
  onChange: (path: string, value: any) => void;
  errors: Record<string, string>;
}> = ({ component, formData, onChange, errors }) => {
  const convertJsonSchemaPath = (path: string): string => {
    return path.replace(/^\$\.properties\./, '').replace(/\.properties\./g, '.');
  };

  switch (component.componentType) {
    case "field":
      { const objectPath = convertJsonSchemaPath(component.jsonSchemaPropertyPath);
      const value = get(formData, objectPath);
      return (
        <Field
          component={component}
          value={value}
          onChange={(newValue) =>
            onChange(component.jsonSchemaPropertyPath, newValue)
          }
          error={errors[objectPath]}
        />
      ); }

    case "grid":
      return (
        <Grid
          component={component}
          formData={formData}
          onChange={onChange}
          errors={errors}
        />
      );

    case "section":
      return (
        <Section
          component={component}
          formData={formData}
          onChange={onChange}
          errors={errors}
        />
      );

    default:
      return null;
  }
};

const Form: React.FC<{
  schema: FormBuilder;
}> = ({ schema }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const ajv = new Ajv2020({ allErrors: true });
  const validate = ajv.compile(dataSchema);

  // Filter steps from the components
  const steps = schema.components.filter(
    (component): component is StepComponent =>
      component.componentType === "step",
  );

  const currentStepComponent = steps[currentStep];

  const convertJsonSchemaPath = (path: string): string => {
    // Remove $.properties. prefix and any other properties references
    return path.replace(/^\$\.properties\./, '').replace(/\.properties\./g, '.');
  };

  const getFieldPathFromError = (error: any): string => {
    if (error.keyword === 'required') {
      // Get the base path from instancePath
      const basePath = error.instancePath.replace(/^\//, '');
      const missingProperty = error.params.missingProperty;

      // If instancePath is empty, it's a root level property
      if (!basePath) {
        return missingProperty;
      }

      // For nested objects, combine the base path with missing property
      return `${basePath}.${missingProperty}`;
    }

    // For other validation errors (minLength, pattern, etc.)
    // Convert /address/street to address.street
    return error.instancePath.replace(/^\//, '').replace(/\//g, '.');
  };

  // Helper function to check if a field should be validated in current step
  const isFieldInCurrentStep = (fieldPath: string): boolean => {
    return currentStepFields.some(stepField => {
      // Exact match
      if (stepField === fieldPath) return true;

      // Check if the field is a parent of any current step field
      // For example, if 'address.street' is in current step,
      // we should validate 'address' required error
      if (stepField.startsWith(`${fieldPath}.`)) return true;

      return false;
    });
  };

  const getFieldPaths = (component: FormBuilderComponent): string[] => {
    switch (component.componentType) {
      case 'field':
        return [convertJsonSchemaPath(component.jsonSchemaPropertyPath)];
      case 'grid':
      case 'section':
        return component.components.flatMap(getFieldPaths);
      default:
        return [];
    }
  };

  const currentStepFields = currentStepComponent.components.flatMap(getFieldPaths);
  const currentStepErrors = Object.entries(errors).reduce((acc, [key, value]) => {
    if (isFieldInCurrentStep(key)) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  // Validate only the current step's fields
  const validateCurrentStep = () => {
    const valid = validate(formData);
    const newErrors: Record<string, string> = {};

    if (!valid && validate.errors) {
      validate.errors.forEach((error) => {
        const fieldPath = getFieldPathFromError(error);
        if (isFieldInCurrentStep(fieldPath)) {
          newErrors[fieldPath] = error.message || "Invalid value";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (path: string, value: any) => {
    const objectPath = convertJsonSchemaPath(path);

    const newFormData = { ...formData };
    set(newFormData, objectPath, value);
    setFormData(newFormData);

    // Validate immediately on change
    const valid = validate(newFormData);
    if (!valid && validate.errors) {
      const newErrors = { ...errors };

      // Clear existing errors for the current step
      currentStepFields.forEach(field => {
        delete newErrors[field];
      });

      // Add new errors for the current step
      validate.errors.forEach((error) => {
        const fieldPath = getFieldPathFromError(error);
        if (isFieldInCurrentStep(fieldPath)) {
          newErrors[fieldPath] = error.message || "Invalid value";
        }
      });

      setErrors(newErrors);
    } else {
      // Clear errors for current step fields only
      const newErrors = { ...errors };
      currentStepFields.forEach(field => {
        delete newErrors[field];
      });
      setErrors(newErrors);
    }
  };

  const handleNext = () => {
    // Validate current step before proceeding
    const isValid = validateCurrentStep();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Clear errors for the current step when going back
      const newErrors = { ...errors };
      currentStepFields.forEach(field => {
        delete newErrors[field];
      });
      setErrors(newErrors);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate final step before submission
    const isValid = validateCurrentStep();
    if (isValid) {
      console.log("Form data:", formData);
    }
  };

  return (
    <div className="form-builder">
      <h2>{schema.metadata.title}</h2>
      <p>{schema.metadata.description}</p>

      <div className="step-indicator">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step-dot ${index === currentStep ? "active" : ""} ${
              index < currentStep ? "completed" : ""
            }`}
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-label">{step.title}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="step">
          <h3 className="step-title">{currentStepComponent.title}</h3>
          {currentStepComponent.components.map((component, index) => (
            <RenderComponent
              key={index}
              component={component}
              formData={formData}
              onChange={handleChange}
              errors={currentStepErrors}
            />
          ))}
        </div>

        <div className="form-navigation">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="nav-button previous"
            >
              Previous
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="nav-button next"
            >
              Next
            </button>
          ) : (
            <button type="submit" className="nav-button submit">
              Submit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Form schema={formBuilderSchema} />
    </div>
  );
}

export default App;
