import React, { useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { Button, Input, Card } from '../components/UI';

export const Login: React.FC = () => {
  const { login } = useWedding();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(password)) {
      setError(true);
    }
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
            placeholder="Enter passcode (Hint: wedding)"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            error={error ? "Incorrect passcode" : undefined}
          />
          <Button type="submit" className="w-full">
            Enter Dashboard
          </Button>
        </form>
      </Card>
    </div>
  );
};