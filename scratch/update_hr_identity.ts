import { query } from '../server/lib/db';

async function main() {
  try {
    const res = await query('SELECT schema_definition FROM system_modules WHERE slug = $1', ['hr-management']);
    if (res.rows.length === 0) {
      console.log('Module not found');
      return;
    }

    let schema = res.rows[0].schema_definition;
    
    // 1. Update NRC field
    const nrcField = schema.find((f: any) => f.id === 'nrc');
    if (nrcField) {
      nrcField.label = "NRC Number";
      nrcField.placeholder = "XXXXXX/XX/X";
      nrcField.validation_regex = "^\\d{6}/\\d{2}/\\d{1}$";
      nrcField.field_description = "Standard Zambian format: 6 digits / 2 digits / 1 digit";
      nrcField.required = false; // Make it optional since they might use passport
    }

    // 2. Add Passport field if it doesn't exist
    if (!schema.find((f: any) => f.id === 'passport_number')) {
      // Find index of NRC and insert after it
      const nrcIndex = schema.findIndex((f: any) => f.id === 'nrc');
      schema.splice(nrcIndex + 1, 0, {
        id: 'passport_number',
        type: 'text',
        label: 'Passport Number',
        required: false,
        placeholder: 'Enter passport number...',
        field_description: 'Required if NRC is not provided'
      });
    }

    await query('UPDATE system_modules SET schema_definition = $1 WHERE slug = $2', [JSON.stringify(schema), 'hr-management']);
    console.log('Module schema updated with Zambian NRC validation and Passport option');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
