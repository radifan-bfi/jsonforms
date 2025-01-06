import { FormBuilder } from "./types";

export const dataSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["firstName", "lastName", "phone", "address"],
  "properties": {
    "firstName": {
      "type": "string",
      "minLength": 2,
    },
    "lastName": {
      "type": "string",
      "minLength": 2,
    },
    "phone": {
      "type": "string",
      "pattern": "^\\+?[1-9]\\d{1,14}$",
    },
    "address": {
      "type": "object",
      "required": ["street", "city", "country"],
      "properties": {
        "street": {
          "type": "string",
          "minLength": 5,
        },
        "city": {
          "type": "string",
        },
        "postalCode": {
          "type": "string",
          "pattern": "^[0-9]{5}$",
        },
        "country": {
          "type": "string",
          "enum": ["USA", "Canada", "UK", "Australia"],
        },
      },
    },
  },
};

export const formBuilderSchema: FormBuilder = {
  version: "1.0.0",
  metadata: {
    title: "Profile Form",
    description: "This is profile form",
    schema: "https://example.com/complex-object.schema.json",
  },
  config: {
    persistData: true,
  },
  components: [
    {
      componentType: "step",
      title: "Personal Data",
      components: [
        {
          componentType: "section",
          title: "Name",
          components: [
            {
              componentType: "grid",
              columns: {
                default: 2,
                sm: 1,
              },
              components: [
                {
                  componentType: "field",
                  jsonSchemaPropertyPath: "$.properties.firstName",
                  inputType: "text",
                  inputProps: {
                    title: "First Name",
                    placeholder: "Input you first name",
                  },
                },
                {
                  componentType: "field",
                  jsonSchemaPropertyPath: "$.properties.lastName",
                  inputType: "text",
                  inputProps: {
                    title: "Last Name",
                    placeholder: "Input your last name",
                  },
                },
              ],
            },
          ],
        },
        {
          componentType: "field",
          jsonSchemaPropertyPath: "$.properties.phone",
          inputType: "text",
          inputProps: {
            title: "Phone Number",
            className: "phone-number",
          },
        },
      ],
    },
    {
      componentType: "step",
      title: "Address",
      components: [
        {
          componentType: "field",
          jsonSchemaPropertyPath: "$.properties.address.properties.country",
          inputType: "select",
          inputProps: {
            title: "Country",
          },
        },
        {
          componentType: "field",
          jsonSchemaPropertyPath: "$.properties.address.properties.city",
          inputType: "text",
          inputProps: {
            title: "City",
          },
        },
        {
          componentType: "field",
          jsonSchemaPropertyPath: "$.properties.address.properties.street",
          inputType: "text",
          inputProps: {
            title: "Street",
          },
        },
        {
          componentType: "field",
          jsonSchemaPropertyPath: "$.properties.address.properties.postalCode",
          inputType: "text",
          inputProps: {
            title: "Postal Code",
          },
          conditions: {
            show: [
              {
                or: [
                  { "===": [{ var: "address.country" }, "USA"] },
                  { "===": [{ var: "address.country" }, "UK"] },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
};
