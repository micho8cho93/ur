import { ProtectedRoute } from '@/src/screens/ProtectedRoute';
import { Stack } from 'expo-router';

export default function TutorialLayout() {
  return (
    <ProtectedRoute>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </ProtectedRoute>
  );
}
