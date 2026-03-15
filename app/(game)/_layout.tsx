import ProtectedRoute from '@/src/screens/ProtectedRoute';
import { Slot } from 'expo-router';

export default function GameLayout() {
  return (
    <ProtectedRoute>
      <Slot />
    </ProtectedRoute>
  );
}
