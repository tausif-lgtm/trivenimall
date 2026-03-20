import { useRouter } from 'next/router';
import NewChecklist from './new';

// Edit mode: same form component, id from URL activates edit mode
export default function EditChecklist() {
  return <NewChecklist />;
}
