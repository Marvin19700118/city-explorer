// This page is no longer used after removing the login flow.
// It can be deleted or left empty.
// For safety, we'll redirect to the map.
import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/map');
}
