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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{inputProps.title}</label>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={inputProps.placeholder}
            disabled={inputProps.disabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputProps.disabled ? 'bg-gray-100' : ''} ${inputProps.className || ''}`}
          />
          {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
        </div>
      );

    case "number":
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{inputProps.title}</label>
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={inputProps.placeholder}
            disabled={inputProps.disabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputProps.disabled ? 'bg-gray-100' : ''} ${inputProps.className || ''}`}
          />
          {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
        </div>
      );

    case "select": {
      const countries = ["USA", "Canada", "UK", "Australia"];
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{inputProps.title}</label>
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={inputProps.disabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputProps.disabled ? 'bg-gray-100' : ''} ${inputProps.className || ''}`}
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
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      {component.title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{component.title}</h3>}
      {component.description && <p className="text-sm text-gray-600 mb-4">{component.description}</p>}
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
  const [isSubmitted, setIsSubmitted] = useState(false);
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
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Form Submitted Successfully!</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Form Data:</h3>
          <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
        <button
          onClick={() => {
            setFormData({});
            setErrors({});
            setCurrentStep(0);
            setIsSubmitted(false);
          }}
          className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Submit Another Response
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{schema.metadata.title}</h2>
      <p className="text-gray-600 mb-6">{schema.metadata.description}</p>

      <div className="flex justify-between items-center mb-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center ${index !== steps.length - 1 ? 'flex-1' : ''}`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 
              ${index === currentStep ? 'border-blue-500 bg-blue-500 text-white' : 
                index < currentStep ? 'border-green-500 bg-green-500 text-white' : 
                'border-gray-300 text-gray-500'}`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-900">{step.title}</span>
            {index !== steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
            )}
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

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Previous
            </button>
          )}
          <div className="flex-1"></div>
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
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
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Form schema={formBuilderSchema} />
    </div>
  );
}

export default App;
