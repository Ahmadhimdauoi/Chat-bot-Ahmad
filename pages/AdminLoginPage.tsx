import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginAdmin } from '../services/apiService';
import Spinner from '../components/Spinner';

const AdminLoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // No password required for this demo setup, strictly purely logic gating
      const response = await loginAdmin("demo-access");
      login(response.token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-10 bg-surface rounded-xl shadow-lg border border-border">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-text-primary">
            Admin Access
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Enter the Chatbot SaaS Dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary py-3 px-4 text-sm font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-colors"
            >
              {isLoading ? <Spinner /> : 'Login to Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;