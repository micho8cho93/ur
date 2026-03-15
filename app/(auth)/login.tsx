import { useAuth } from '@/src/auth/useAuth';
import LoginScreen from '@/src/screens/LoginScreen';
import { Redirect } from 'expo-router';

export default function Login() {
  const { user } = useAuth();

  if (user) {
    return <Redirect href="/" />;
  }

  return <LoginScreen />;
}
