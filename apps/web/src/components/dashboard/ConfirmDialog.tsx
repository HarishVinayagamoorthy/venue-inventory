import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', isDestructive = false }: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-brand-orange/20 text-brand-orange'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-brand-charcoal">{title}</h3>
        </div>
        <p className="text-gray-500 mb-8">{message}</p>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button 
            className={`flex-1 ${isDestructive ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
