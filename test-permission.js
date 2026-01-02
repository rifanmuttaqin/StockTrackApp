// Test file to verify usePermission hook fix
import { usePermission } from './resources/js/Hooks/usePermission.js';

console.log('Testing usePermission hook...');
const { can } = usePermission();

console.log('can function:', typeof can);
console.log('can function result:', can('users.index'));

// Test with a simple permission check
if (can('users.index')) {
    console.log('SUCCESS: can function works correctly');
} else {
    console.log('ERROR: can function failed');
}
