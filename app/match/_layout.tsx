import ProtectedRoute from '@/src/screens/ProtectedRoute';
import { Slot } from 'expo-router';

export default function MatchLayout() {
  return (
    <ProtectedRoute>
      <Slot />
    </ProtectedRoute>
  );
}
