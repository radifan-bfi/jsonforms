import { JsonForms } from '@jsonforms/react';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import { useState } from 'react';
import { Button, Container, Typography } from '@mui/material';

const schema = {
  type: 'object',
  properties: {
    firstName: {
      type: 'string',
      minLength: 2,
      description: 'Please enter your first name'
    },
    lastName: {
      type: 'string',
      minLength: 2,
      description: 'Please enter your last name'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Please enter your email address'
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'Please enter a password (min 8 characters)'
    }
  },
  required: ['firstName', 'lastName', 'email', 'password']
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/firstName',
      label: 'First Name'
    },
    {
      type: 'Control',
      scope: '#/properties/lastName',
      label: 'Last Name'
    },
    {
      type: 'Control',
      scope: '#/properties/email',
      label: 'Email'
    },
    {
      type: 'Control',
      scope: '#/properties/password',
      label: 'Password',
      options: {
        format: 'password'
      }
    }
  ]
};

export function Form() {
  const [formData, setFormData] = useState({});

  const handleSubmit = () => {
    console.log('Form data submitted:', formData);
    // Here you would typically make an API call to register the user
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        User Registration
      </Typography>
      <JsonForms
        schema={schema}
        uischema={uischema}
        data={formData}
        renderers={materialRenderers}
        cells={materialCells}
        onChange={({ data }) => setFormData(data)}
      />
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSubmit}
        sx={{ mt: 2 }}
      >
        Register
      </Button>
    </Container>
  );
}
