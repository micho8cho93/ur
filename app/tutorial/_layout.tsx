import ProtectedRoute from '@/src/screens/ProtectedRoute';
import { Slot } from 'expo-router';

export default function TutorialLayout() {
  return (
    <ProtectedRoute>
      <Slot />
    </ProtectedRoute>
  );
}
