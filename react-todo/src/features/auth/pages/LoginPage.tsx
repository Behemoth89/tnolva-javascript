import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/useAuthStore';
import type { LoginResponse } from '../types/auth';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const validateEmail = (value: string): string | undefined => {
    if (!value) return 'Email is required.';
    if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address.';
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return 'Password is required.';
    if (value.length < 6) return 'Password must be at least 6 characters.';
    return undefined;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'email' ? email : password;
    const error =
      field === 'email' ? validateEmail(value) : validatePassword(value);
    setErrors((prev) => ({ ...prev, [field]: error, general: undefined }));
  };

  const handleChange = (
    field: 'email' | 'password',
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
    // Clear the field's error when user starts typing (per D-12)
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await apiClient.post<LoginResponse>('/api/auth/login', {
        email,
        password,
      });

      const { token, refreshToken, firstName, lastName } = response.data;
      setAuth({ token, refreshToken, firstName, lastName });
      navigate('/dashboard');
    } catch (err: unknown) {
      // Axios error with response = server returned error (e.g. 401 invalid credentials)
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status
      ) {
        setErrors({
          password: 'Invalid email or password. Please try again.',
        });
      } else {
        // Network error or unreachable
        setErrors({
          general:
            'Unable to connect. Please check your connection and try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-zinc-100 mb-6 text-center">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          {/* General error */}
          {errors.general && (
            <div
              className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20"
              role="alert"
            >
              <p className="text-sm text-red-500">{errors.general}</p>
            </div>
          )}

          {/* Email field */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-100 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleChange('email', e)}
              onBlur={() => handleBlur('email')}
              placeholder="your@email.com"
              autoFocus
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              className="w-full min-h-[44px] px-3 py-2 border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder-zinc-400 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            {errors.email && touched.email && (
              <p
                id="email-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-100 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handleChange('password', e)}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              className="w-full min-h-[44px] px-3 py-2 border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder-zinc-400 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            {errors.password && touched.password && (
              <p
                id="password-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded font-medium min-h-[44px] flex items-center justify-center ${
              isSubmitting
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
            }`}
          >
            {isSubmitting && (
              <svg
                className="animate-spin h-5 w-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Register link */}
        <p className="mt-6 text-center text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-amber-500 hover:text-amber-400 font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
