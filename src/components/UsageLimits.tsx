// components/UsageLimits.tsx
'use client';

import { useState, useEffect } from 'react';
import { Zap, Users, Calendar, MessageCircle, RefreshCw } from 'lucide-react';
import { SubscriptionService } from '@/lib/subscription/service';

interface UsageLimitsProps {
    userId: string;
}

export default function UsageLimits({ userId }: UsageLimitsProps) {
    const [limits, setLimits] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const subscriptionService = new SubscriptionService();

    useEffect(() => {
        loadLimits();
    }, [userId]);

    const loadLimits = async () => {
        const features = ['circleOfSix', 'vibePlanner', 'messages', 'swipes'];
        const limitsData: Record<string, any> = {};

        for (const feature of features) {
            const status = await subscriptionService.getFeatureStatus(userId, feature);
            limitsData[feature] = status;
        }

        setLimits(limitsData);
        setLoading(false);
    };

    if (loading) {
        return <div className="animate-pulse">Chargement des limites...</div>;
    }

    const featureConfigs = {
        circleOfSix: {
            icon: Users,
            label: 'Circle of Six',
            description: 'Création de cercle'
        },
        vibePlanner: {
            icon: Calendar,
            label: 'VibePlanner',
            description: 'Planification d\'événements'
        },
        messages: {
            icon: MessageCircle,
            label: 'Messages',
            description: 'Envoi de messages'
        },
        swipes: {
            icon: Zap,
            label: 'Swipes',
            description: 'Découverte de profils'
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#1C1C1C]">
                Vos limites d'utilisation
            </h3>

            <div className="grid gap-4">
                {Object.entries(featureConfigs).map(([feature, config]) => {
                    const limitData = limits[feature];
                    const Icon = config.icon;

                    if (!limitData || limitData.unlimited) return null;

                    const percentage = (limitData.used / limitData.limit) * 100;
                    const isWarning = percentage > 80;
                    const isDanger = percentage > 95;

                    return (
                        <div
                            key={feature}
                            className="p-4 rounded-xl border border-[#F0F0F0] bg-white"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#8E7AB5]/10">
                                        <Icon className="w-5 h-5 text-[#8E7AB5]" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-[#1C1C1C]">
                                            {config.label}
                                        </h4>
                                        <p className="text-sm text-[#666]">
                                            {config.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="font-semibold text-[#1C1C1C]">
                                        {limitData.used} / {limitData.limit}
                                    </div>
                                    <div className="text-xs text-[#666]">
                                        {limitData.period === 'daily' ? 'Aujourd\'hui' :
                                            limitData.period === 'weekly' ? 'Cette semaine' :
                                                'Ce mois-ci'}
                                    </div>
                                </div>
                            </div>

                            {/* Barre de progression */}
                            <div className="mt-2">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${isDanger ? 'bg-red-500' :
                                            isWarning ? 'bg-yellow-500' :
                                                'bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF]'
                                            }`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                </div>

                                {isWarning && (
                                    <p className="text-xs mt-2 text-yellow-600">
                                        ⚠️ Vous approchez de votre limite
                                    </p>
                                )}

                                {limitData.nextReset && (
                                    <p className="text-xs mt-2 text-[#666]">
                                        <RefreshCw className="w-3 h-3 inline mr-1" />
                                        Réinitialisation : {limitData.nextReset.toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}