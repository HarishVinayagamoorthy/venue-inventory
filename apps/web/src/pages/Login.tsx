import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { loginSchema, LoginInput } from 'shared-validation';
import { authApi } from '../api/auth.api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.token, data.user);
      showToast('Successfully logged in', 'success');
      navigate('/');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to login';
      showToast(message, 'error');
    }
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = (data: LoginInput) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-brand-charcoal">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-500">Sign in to manage your bookings</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" isLoading={mutation.isPending}>
            Sign In
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-500">Don't have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-medium text-brand-orange hover:text-orange-600"
            >
              Register here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
