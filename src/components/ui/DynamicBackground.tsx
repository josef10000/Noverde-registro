import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';

interface DynamicBackgroundProps {
  theme: UserProfile['theme'];
}

export const DynamicBackground = ({ theme = 'dark' }: DynamicBackgroundProps) => {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      <AnimatePresence mode="wait">
        {theme === 'sky' && (
          <motion.div
            key="sky"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-[#7dd3fc] via-[#bae6fd] to-[#f0f9ff]"
          >
            {/* Sun Glow */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-yellow-100/20 blur-[120px] rounded-full" />
            
            {/* Refined Clouds */}
            <motion.div 
              animate={{ x: [0, 100, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-[10%] w-72 h-40 bg-white/50 blur-[60px] rounded-[100%]"
            />
            <motion.div 
              animate={{ x: [0, -150, 0], y: [0, -30, 0], scale: [1.1, 1, 1.1] }}
              transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-60 right-[15%] w-[500px] h-64 bg-white/40 blur-[80px] rounded-[100%]"
            />
            <motion.div 
              animate={{ x: [0, 80, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-40 left-[20%] w-96 h-48 bg-white/30 blur-[70px] rounded-[100%]"
            />
          </motion.div>
        )}

        {theme === 'purple' && (
          <motion.div
            key="purple"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0c0a09]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.2),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(139,92,246,0.1),transparent_50%)]" />
            
            {/* Floating Stars/Particles */}
            <div className="absolute inset-0">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: Math.random() * 0.5 }}
                  animate={{ 
                    opacity: [0.1, 0.5, 0.1],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 4, 
                    repeat: Infinity,
                    delay: Math.random() * 5
                  }}
                  className="absolute w-0.5 h-0.5 bg-white rounded-full"
                  style={{ 
                    top: `${Math.random() * 100}%`, 
                    left: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Deep Cosmic Clouds */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 20, repeat: Infinity }}
              className="absolute top-1/4 left-1/3 w-[800px] h-[800px] bg-purple-900/20 blur-[150px] rounded-full"
            />
          </motion.div>
        )}

        {theme === 'dark' && (
          <motion.div
            key="dark"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#020617]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.03),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,41,59,0.2),transparent_50%)]" />
            
            {/* Subtle Gradient Lines */}
            <div className="absolute inset-0 opacity-[0.03]" 
                 style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
