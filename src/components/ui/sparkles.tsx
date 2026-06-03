'use client';

import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SparklesCoreProps {
    className?: string;
    background?: string;
    minSize?: number;
    maxSize?: number;
    particleDensity?: number;
}

export const SparklesCore = ({
    className,
    background,
    minSize = 1,
    maxSize = 2,
    particleDensity = 80,
}: SparklesCoreProps) => {
    const particleCount = Math.floor(
        (window.innerWidth * window.innerHeight) / 8000 / (100 / particleDensity)
    );

    const particles = useMemo(() => {
        return new Array(particleCount).fill(null).map(() => ({
            id: crypto.randomUUID(),
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: Math.random() * (maxSize - minSize) + minSize,
            delay: Math.random() * 5,
            duration: Math.random() * 3 + 2,
        }));
    }, []);

    return (
        <div
            className={cn(
                'absolute inset-0 overflow-hidden pointer-events-none',
                className
            )}
            style={{ background }}
        >
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{
                        repeat: Infinity,
                        delay: p.delay,
                        duration: p.duration,
                    }}
                    className="absolute rounded-full bg-white"
                    style={{
                        top: p.top,
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        opacity: 0.6,
                    }}
                />
            ))}
        </div>
    );
};