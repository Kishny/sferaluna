// middleware/subscription-check.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Subscription } from '@/models/Subscription';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';

export class SubscriptionChecker {
  private user: any;
  private subscription: any;

  constructor(userId: string) {
    this.user = null;
    this.subscription = null;
  }

  async initialize() {
    await connectDB();
    this.user = await User.findById(this.userId);
    this.subscription = await Subscription.findOne({ 
      userId: this.userId, 
      status: 'active' 
    });
  }

  // Vérifie si l'utilisateur peut effectuer une action
  async canPerformAction(action: string, count: number = 1): Promise<{
    allowed: boolean;
    reason?: string;
    remaining?: number;
    limit?: number;
  }> {
    await this.initialize();

    if (!this.subscription) {
      return {
        allowed: false,
        reason: 'Aucun abonnement actif trouvé'
      };
    }

    // Vérifier si l'abonnement est expiré
    if (this.subscription.currentPeriodEnd < new Date()) {
      return {
        allowed: false,
        reason: 'Votre abonnement a expiré'
      };
    }

    const plan = this.subscription.plan as keyof typeof SUBSCRIPTION_PLANS;
    const planConfig = SUBSCRIPTION_PLANS[plan];

    // Vérifications spécifiques par action
    switch (action) {
      case 'swipe':
        const today = new Date().toDateString();
        const dailyCount = await this.getDailyCount('swipes', today);
        
        if (dailyCount + count > planConfig.limits.dailySwipes) {
          return {
            allowed: false,
            reason: 'Limite quotidienne de swipes atteinte',
            remaining: Math.max(0, planConfig.limits.dailySwipes - dailyCount),
            limit: planConfig.limits.dailySwipes
          };
        }
        break;

      case 'send_message':
        const messageCount = await this.getDailyCount('messages', new Date().toDateString());
        
        if (messageCount + count > planConfig.limits.dailyMessages) {
          return {
            allowed: false,
            reason: 'Limite quotidienne de messages atteinte',
            remaining: Math.max(0, planConfig.limits.dailyMessages - messageCount),
            limit: planConfig.limits.dailyMessages
          };
        }
        break;

      case 'use_boost':
        const month = new Date().getMonth();
        const boostCount = await this.getMonthlyCount('boosts', month);
        
        if (boostCount + count > planConfig.limits.boostPerMonth) {
          return {
            allowed: false,
            reason: 'Limite mensuelle de boosts atteinte',
            remaining: Math.max(0, planConfig.limits.boostPerMonth - boostCount),
            limit: planConfig.limits.boostPerMonth
          };
        }
        break;

      case 'view_profile':
        const viewCount = await this.getTotalCount('profileViews');
        
        if (viewCount + count > planConfig.limits.profileViews) {
          return {
            allowed: false,
            reason: 'Limite de vues de profils atteinte',
            remaining: Math.max(0, planConfig.limits.profileViews - viewCount),
            limit: planConfig.limits.profileViews
          };
        }
        break;

      case 'use_super_like':
        const superLikeCount = await this.getDailyCount('superLikes', new Date().toDateString());
        
        if (superLikeCount + count > planConfig.limits.superLikesPerDay) {
          return {
            allowed: false,
            reason: 'Limite quotidienne de super likes atteinte',
            remaining: Math.max(0, planConfig.limits.superLikesPerDay - superLikeCount),
            limit: planConfig.limits.superLikesPerDay
          };
        }
        break;
    }

    return { allowed: true };
  }

  // Vérifie si une fonctionnalité est disponible
  hasFeature(feature: string): boolean {
    if (!this.subscription) return false;
    
    const plan = this.subscription.plan as keyof typeof SUBSCRIPTION_PLANS;
    const planConfig = SUBSCRIPTION_PLANS[plan];
    
    return planConfig.features[feature as keyof typeof planConfig.features] === true;
  }

  // Obtenir le plan actuel
  getCurrentPlan() {
    return this.subscription?.plan || 'free';
  }

  // Obtenir les limites actuelles
  getCurrentLimits() {
    const plan = this.getCurrentPlan() as keyof typeof SUBSCRIPTION_PLANS;
    return SUBSCRIPTION_PLANS[plan].limits;
  }

  // Obtenir les fonctionnalités actuelles
  getCurrentFeatures() {
    const plan = this.getCurrentPlan() as keyof typeof SUBSCRIPTION_PLANS;
    return SUBSCRIPTION_PLANS[plan].features;
  }

  // Méthodes utilitaires pour compter les actions
  private async getDailyCount(action: string, date: string): Promise<number> {
    // Implémentation avec votre base de données
    // Exemple avec un modèle Usage
    return 0; // À implémenter
  }

  private async getMonthlyCount(action: string, month: number): Promise<number> {
    // Implémentation avec votre base de données
    return 0; // À implémenter
  }

  private async getTotalCount(action: string): Promise<number> {
    // Implémentation avec votre base de données
    return 0; // À implémenter
  }
}

// Middleware pour les routes API
export async function subscriptionMiddleware(
  req: NextRequest,
  requiredPlan?: keyof typeof SUBSCRIPTION_PLANS,
  requiredFeature?: string
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const subscription = await Subscription.findOne({
      userId: user._id,
      status: 'active'
    });

    // Vérifier le plan minimum requis
    if (requiredPlan) {
      const planHierarchy = ['free', 'basic', 'premium', 'vip'];
      const userPlan = subscription?.plan || 'free';
      
      if (planHierarchy.indexOf(userPlan) < planHierarchy.indexOf(requiredPlan)) {
        return NextResponse.json(
          {
            error: 'Plan insuffisant',
            requiredPlan,
            currentPlan: userPlan,
            upgradeUrl: '/premium/upgrade'
          },
          { status: 403 }
        );
      }
    }

    // Vérifier la fonctionnalité spécifique
    if (requiredFeature && subscription) {
      const plan = subscription.plan as keyof typeof SUBSCRIPTION_PLANS;
      const hasFeature = SUBSCRIPTION_PLANS[plan].features[
        requiredFeature as keyof typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]['features']
      ];

      if (!hasFeature) {
        return NextResponse.json(
          {
            error: 'Fonctionnalité non disponible',
            feature: requiredFeature,
            currentPlan: subscription.plan,
            upgradeUrl: '/premium/upgrade'
          },
          { status: 403 }
        );
      }
    }

    // Ajouter les informations d'abonnement à la requête
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', user._id.toString());
    requestHeaders.set('x-subscription-plan', subscription?.plan || 'free');
    requestHeaders.set('x-subscription-status', subscription?.status || 'inactive');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Subscription middleware error:', error);
    return NextResponse.json(
      { error: 'Erreur de vérification d\'abonnement' },
      { status: 500 }
    );
  }
}