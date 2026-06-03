// lib/subscription/service.ts
import { PLAN_CONFIG, PlanType } from './config';
import prisma from '@/lib/prisma';

export class SubscriptionService {
  async checkUsage(
    userId: string,
    feature: string,
    increment: number = 1
  ): Promise<{ allowed: boolean; remaining?: number; message?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        usage: true
      }
    });

    if (!user?.subscription?.plan) {
      return { allowed: false, message: 'Aucun plan actif' };
    }

    const plan = PLAN_CONFIG[user.subscription.plan as PlanType];
    const featureConfig = plan.features[feature as keyof typeof plan.features];

    // Si la feature est illimitée
    if (featureConfig?.unlimited) {
      return { allowed: true };
    }

    // Vérifier les limites
    const usage = await this.getOrCreateUsage(userId, feature);
    const limit = featureConfig?.limit;
    const period = featureConfig?.period;

    if (!limit || !period) {
      return { allowed: false, message: 'Feature non disponible dans votre plan' };
    }

    // Vérifier si on doit reset le compteur
    const shouldReset = this.shouldResetCounter(usage.lastReset, period);
    
    if (shouldReset) {
      await prisma.usage.update({
        where: { id: usage.id },
        data: { count: 0, lastReset: new Date() }
      });
      usage.count = 0;
    }

    // Vérifier la limite
    if (usage.count + increment > limit) {
      const remaining = limit - usage.count;
      let message = '';
      
      if (remaining <= 0) {
        switch (period) {
          case 'daily':
            message = 'Limite quotidienne atteinte. Réinitialisation demain.';
            break;
          case 'weekly':
            message = 'Limite hebdomadaire atteinte. Réinitialisation dans 7 jours.';
            break;
          case 'monthly':
            message = 'Limite mensuelle atteinte. Réinitialisation le mois prochain.';
            break;
        }
      } else {
        message = `Il vous reste ${remaining} utilisation(s) ${this.getPeriodText(period)}`;
      }

      return { allowed: false, remaining, message };
    }

    // Incrémenter l'usage
    await prisma.usage.update({
      where: { id: usage.id },
      data: { count: { increment } }
    });

    return { allowed: true, remaining: limit - (usage.count + increment) };
  }

  async getFeatureStatus(userId: string, feature: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        usage: true
      }
    });

    if (!user?.subscription?.plan) {
      return { hasAccess: false, limit: 0, used: 0 };
    }

    const plan = PLAN_CONFIG[user.subscription.plan as PlanType];
    const featureConfig = plan.features[feature as keyof typeof plan.features];

    if (featureConfig?.unlimited) {
      return { hasAccess: true, unlimited: true };
    }

    const usage = await this.getOrCreateUsage(userId, feature);
    const limit = featureConfig?.limit || 0;
    const period = featureConfig?.period;

    return {
      hasAccess: true,
      limit,
      used: usage.count,
      remaining: Math.max(0, limit - usage.count),
      period,
      nextReset: this.getNextResetDate(usage.lastReset, period)
    };
  }

  private async getOrCreateUsage(userId: string, feature: string) {
    let usage = await prisma.usage.findFirst({
      where: { userId, feature }
    });

    if (!usage) {
      usage = await prisma.usage.create({
        data: {
          userId,
          feature,
          count: 0,
          lastReset: new Date()
        }
      });
    }

    return usage;
  }

  private shouldResetCounter(lastReset: Date, period: string): boolean {
    const now = new Date();
    const lastResetDate = new Date(lastReset);
    
    switch (period) {
      case 'daily':
        return now.getDate() !== lastResetDate.getDate() ||
               now.getMonth() !== lastResetDate.getMonth() ||
               now.getFullYear() !== lastResetDate.getFullYear();
      
      case 'weekly':
        const weekStart = new Date(lastResetDate);
        weekStart.setDate(lastResetDate.getDate() - lastResetDate.getDay());
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay());
        return weekStart.getTime() !== currentWeekStart.getTime();
      
      case 'monthly':
        return now.getMonth() !== lastResetDate.getMonth() ||
               now.getFullYear() !== lastResetDate.getFullYear();
      
      default:
        return false;
    }
  }

  private getPeriodText(period: string): string {
    switch (period) {
      case 'daily': return 'aujourd\'hui';
      case 'weekly': return 'cette semaine';
      case 'monthly': return 'ce mois-ci';
      default: return '';
    }
  }

  private getNextResetDate(lastReset: Date, period: string): Date {
    const nextReset = new Date(lastReset);
    
    switch (period) {
      case 'daily':
        nextReset.setDate(nextReset.getDate() + 1);
        nextReset.setHours(0, 0, 0, 0);
        break;
      
      case 'weekly':
        nextReset.setDate(nextReset.getDate() + 7);
        nextReset.setHours(0, 0, 0, 0);
        break;
      
      case 'monthly':
        nextReset.setMonth(nextReset.getMonth() + 1);
        nextReset.setDate(1);
        nextReset.setHours(0, 0, 0, 0);
        break;
    }
    
    return nextReset;
  }
}