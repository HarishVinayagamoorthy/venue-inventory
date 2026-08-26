import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface HoldTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export const HoldTimer = ({ expiresAt, onExpire }: HoldTimerProps) => {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const expiration = new Date(expiresAt).getTime();
      return Math.max(0, Math.floor((expiration - now) / 1000));
    };

    setRemaining(calculateRemaining());

    const timer = setInterval(() => {
      const timeLeft = calculateRemaining();
      setRemaining(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (remaining <= 0) {
    return (
      <div className="flex items-center text-red-600 font-bold bg-red-50 px-3 py-2 rounded-lg">
        <Clock className="w-4 h-4 mr-2" />
        Hold Expired
      </div>
    );
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className={`flex items-center font-mono font-bold px-3 py-2 rounded-lg ${remaining < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-brand-navy/10 text-brand-navy'}`}>
      <Clock className="w-4 h-4 mr-2" />
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};
