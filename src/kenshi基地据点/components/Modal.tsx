import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, icon }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
          >
            <div className="glass-panel rounded-xl overflow-hidden shadow-2xl shadow-amber-900/10 border-slate-700/60">
              <div className="relative border-b border-white/5 bg-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {icon && <div className="text-amber-500">{icon}</div>}
                  <h2 className="text-lg font-medium text-slate-100 tracking-wide">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
