import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: {
      city: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (like location.city)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (error) setError('');
    if (message) setMessage('');
    if (authError) clearError();
  };

  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 1) {
      errors.name = 'Name must be at least 1 character long';
    }
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // City validation
    if (!formData.location.city.trim()) {
      errors['location.city'] = 'City is required';
    }
    
    setFieldErrors(errors);
    
    // If there are errors, set a general error message
    if (Object.keys(errors).length > 0) {
      setError('Please fix the errors below');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    clearError();

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);

      if (result.success) {
        setMessage('Account created successfully! Redirecting...');
        // Add a small delay to show the success message
        setTimeout(() => {
          navigate('/reports', { replace: true });
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="back-to-home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            Back to Home
          </Link>
          <h1>Join Mangrove Guardians</h1>
          <p>Help protect mangrove forests by reporting incidents and monitoring conservation efforts</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Success Message */}
          {message && (
            <div className="message success">
              {message}
            </div>
          )}

          {/* Error Message */}
          {(error || authError) && (
            <div className="error-message">
              {error || authError}
            </div>
          )}

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              className={fieldErrors.name ? 'error' : ''}
            />
            {fieldErrors.name && (
              <div className="field-error">{fieldErrors.name}</div>
            )}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className={fieldErrors.email ? 'error' : ''}
            />
            {fieldErrors.email && (
              <div className="field-error">{fieldErrors.email}</div>
            )}
          </div>





          {/* Location Fields */}
          <div className="form-group">
            <label htmlFor="location.city">City</label>
            <input
              id="location.city"
              name="location.city"
              type="text"
              placeholder="Your city"
              value={formData.location.city}
              onChange={handleChange}
              className={fieldErrors['location.city'] ? 'error' : ''}
            />
            {fieldErrors['location.city'] && (
              <div className="field-error">{fieldErrors['location.city']}</div>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className={fieldErrors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <span className="toggle-icon">Hide</span>
                ) : (
                  <span className="toggle-icon">Show</span>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="field-error">{fieldErrors.password}</div>
            )}
            
            {/* Password Requirements */}
            {formData.password && (
              <div className="password-requirements">
                <h4>Password Requirements:</h4>
                <ul>
                  <li className={formData.password.length >= 6 ? 'valid' : ''}>
                    {formData.password.length >= 6 ? '✓' : '○'} At least 6 characters
                  </li>
                  <li className={/[a-z]/.test(formData.password) ? 'valid' : ''}>
                    {/[a-z]/.test(formData.password) ? '✓' : '○'} One lowercase letter
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>
                    {/[A-Z]/.test(formData.password) ? '✓' : '○'} One uppercase letter
                  </li>
                  <li className={/\d/.test(formData.password) ? 'valid' : ''}>
                    {/\d/.test(formData.password) ? '✓' : '○'} One number
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={fieldErrors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <span className="toggle-icon">Hide</span>
                ) : (
                  <span className="toggle-icon">Show</span>
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <div className="field-error">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn primary full-width"
          >
            {loading ? 'Creating account...' : 'Join Mangrove Guardians'}
          </button>

          {/* Sign In Link */}
          <div className="auth-links">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="link">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;