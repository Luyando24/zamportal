import { query } from '../server/lib/db';

async function main() {
  try {
    const res = await query('SELECT schema_definition FROM system_modules WHERE slug = $1', ['hr-management']);
    if (res.rows.length === 0) {
      console.log('Module not found');
      return;
    }

    let schema = res.rows[0].schema_definition;
    
    // Remove old ones
    schema = schema.filter((f: any) => f.id !== 'email' && f.id !== 'password');

    // Add Email and Password with correct types
    schema.push({
      id: 'email',
      type: 'text',
      label: 'Work Email',
      required: true,
      placeholder: 'employee@institution.gov.zm'
    });

    schema.push({
      id: 'password',
      type: 'password', // Change to password type for security
      label: 'Initial Password',
      required: true,
      placeholder: 'Enter temporary password...'
    });

    await query('UPDATE system_modules SET schema_definition = $1 WHERE slug = $2', [JSON.stringify(schema), 'hr-management']);
    console.log('Module schema updated with password type');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
