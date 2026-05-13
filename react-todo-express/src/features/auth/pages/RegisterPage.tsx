import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { apiClient } from '../../../lib/apiClient';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { LoginResponse } from '../../../types/auth';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  general?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(
  name: string,
  value: string,
  allValues: { password?: string }
): string | undefined {
  switch (name) {
    case 'email':
      if (!value.trim()) return 'Email is required.';
      if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address.';
      return undefined;
    case 'password':
      if (!value) return 'Password is required.';
      if (value.length < 6) return 'Password must be at least 6 characters.';
      return undefined;
    case 'confirmPassword':
      if (!value) return 'Please confirm your password.';
      if (value !== allValues.password) return 'Passwords do not match.';
      return undefined;
    case 'firstName':
      if (!value.trim()) return 'First name is required.';
      return undefined;
    case 'lastName':
      if (!value.trim()) return 'Last name is required.';
      return undefined;
    default:
      return undefined;
  }
}

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const allValues = { password };
    const values = getAllValues();
    const error = validateField(field, values[field as keyof typeof values], allValues);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const getAllValues = () => ({
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
  });

  const handleChange = (
    field: string,
    setter: (val: string) => void,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setter(e.target.value);
    // Clear the specific field's error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const allValues = getAllValues();
    const newErrors: FormErrors = {};
    let hasErrors = false;

    for (const field of ['email', 'password', 'confirmPassword', 'firstName', 'lastName'] as const) {
      const error = validateField(field, allValues[field], { password: allValues.password });
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setErrors(newErrors);
      setTouched({ email: true, password: true, confirmPassword: true, firstName: true, lastName: true });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await apiClient.post<LoginResponse>('/Account/Register', {
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      setAuth({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
      });

      navigate('/dashboard');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status: number; data?: { messages?: string[] } } };
        const msgs = axiosErr.response?.data?.messages;
        const hasDuplicate = msgs?.some(m => m.toLowerCase().includes('already'));
        if (axiosErr.response?.status === 409 || hasDuplicate) {
          setErrors({ email: 'An account with this email already exists.' });
        } else if (axiosErr.response?.status && axiosErr.response.status >= 400 && axiosErr.response.status < 500) {
          const message = msgs && msgs.length > 0 ? msgs.join(' ') : 'Registration failed. Please try again.';
          setErrors({ general: message });
        } else {
          setErrors({ general: 'Registration failed. Please try again.' });
        }
      } else {
        setErrors({ general: 'Unable to connect. Please check your connection and try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClasses =
    'w-full min-h-[44px] px-3 py-2 border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder-zinc-400 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-zinc-100 mb-6 text-center">Create Account</h1>

        {errors.general && (
          <div className="mb-4 text-sm text-red-500" role="alert">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-100 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder="your@email.com"
              autoComplete="email"
              autoFocus
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={inputBaseClasses}
              onChange={(e) => handleChange('email', setEmail, e)}
              onBlur={() => handleBlur('email')}
            />
            {touched.email && errors.email && (
              <p id="email-error" className="text-sm text-red-500 mt-1" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-100 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={inputBaseClasses}
              onChange={(e) => handleChange('password', setPassword, e)}
              onBlur={() => handleBlur('password')}
            />
            {touched.password && errors.password && (
              <p id="password-error" className="text-sm text-red-500 mt-1" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-100 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              className={inputBaseClasses}
              onChange={(e) => handleChange('confirmPassword', setConfirmPassword, e)}
              onBlur={() => handleBlur('confirmPassword')}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-red-500 mt-1" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* First Name */}
          <div className="mb-4">
            <label htmlFor="firstName" className="block text-sm font-medium text-zinc-100 mb-2">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              placeholder="John"
              autoComplete="given-name"
              aria-describedby={errors.firstName ? 'first-name-error' : undefined}
              className={inputBaseClasses}
              onChange={(e) => handleChange('firstName', setFirstName, e)}
              onBlur={() => handleBlur('firstName')}
            />
            {touched.firstName && errors.firstName && (
              <p id="first-name-error" className="text-sm text-red-500 mt-1" role="alert">
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div className="mb-6">
            <label htmlFor="lastName" className="block text-sm font-medium text-zinc-100 mb-2">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              placeholder="Doe"
              autoComplete="family-name"
              aria-describedby={errors.lastName ? 'last-name-error' : undefined}
              className={inputBaseClasses}
              onChange={(e) => handleChange('lastName', setLastName, e)}
              onBlur={() => handleBlur('lastName')}
            />
            {touched.lastName && errors.lastName && (
              <p id="last-name-error" className="text-sm text-red-500 mt-1" role="alert">
                {errors.lastName}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center justify-center font-medium py-3 w-full rounded-md transition-colors ${
              isSubmitting
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
            }`}
          >
            {isSubmitting && (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-zinc-600"
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
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-500 hover:text-amber-400">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
