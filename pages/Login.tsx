import React, { useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { Button, Input, Card } from '../components/UI';

export const Login: React.FC = () => {
  const { login } = useWedding();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(password);
    if (!success) {
      setError(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-wedding-ivory flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-wedding-charcoal mb-2">Admin Access</h1>
          <p className="text-wedding-stone text-sm">Please enter the passcode to manage invitations.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="password"
            placeholder="Enter passcode"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            error={error ? "Incorrect passcode or Auth not enabled" : undefined}
          />
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Enter Dashboard
          </Button>
        </form>
      </Card>
    </div>
  );
};
