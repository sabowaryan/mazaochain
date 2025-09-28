import { notificationService, NotificationType } from './notification';

/**
 * Helper functions to send notifications for specific events
 */

export class NotificationHelpers {
  
  /**
   * Send registration notifications
   */
  static async sendRegistrationNotification(
    userId: string, 
    status: 'pending' | 'approved' | 'rejected',
    userRole: string
  ) {
    const notifications = {
      pending: {
        type: 'registration_pending' as NotificationType,
        title: 'Inscription en cours de validation',
        message: `Votre inscription en tant que ${userRole} est en cours de validation par notre équipe.`
      },
      approved: {
        type: 'registration_approved' as NotificationType,
        title: 'Inscription approuvée',
        message: `Félicitations! Votre inscription en tant que ${userRole} a été approuvée. Vous pouvez maintenant accéder à toutes les fonctionnalités.`
      },
      rejected: {
        type: 'registration_rejected' as NotificationType,
        title: 'Inscription rejetée',
        message: `Votre inscription en tant que ${userRole} a été rejetée. Veuillez contacter le support pour plus d'informations.`
      }
    };

    const notification = notifications[status];
    
    await notificationService.sendNotification({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: {
        userRole,
        status,
        actionUrl: '/dashboard/profile'
      }
    });
  }

  /**
   * Send crop evaluation notifications
   */
  static async sendEvaluationNotification(
    userId: string,
    status: 'submitted' | 'approved' | 'rejected',
    evaluationData?: {
      cropType?: string;
      estimatedValue?: number;
      evaluationId?: string;
    }
  ) {
    const notifications = {
      submitted: {
        type: 'evaluation_submitted' as NotificationType,
        title: 'Évaluation de culture soumise',
        message: `Votre évaluation de ${evaluationData?.cropType || 'culture'} a été soumise et est en cours de révision.`
      },
      approved: {
        type: 'evaluation_approved' as NotificationType,
        title: 'Évaluation approuvée',
        message: `Votre évaluation de ${evaluationData?.cropType || 'culture'} a été approuvée. Valeur estimée: ${evaluationData?.estimatedValue || 0} USDC.`
      },
      rejected: {
        type: 'evaluation_rejected' as NotificationType,
        title: 'Évaluation rejetée',
        message: `Votre évaluation de ${evaluationData?.cropType || 'culture'} a été rejetée. Veuillez réviser et soumettre à nouveau.`
      }
    };

    const notification = notifications[status];
    
    await notificationService.sendNotification({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: {
        ...evaluationData,
        status,
        actionUrl: `/dashboard/farmer/evaluations${evaluationData?.evaluationId ? `/${evaluationData.evaluationId}` : ''}`
      }
    });
  }

  /**
   * Send loan notifications
   */
  static async sendLoanNotification(
    userId: string,
    status: 'requested' | 'approved' | 'rejected' | 'disbursed',
    loanData?: {
      amount?: number;
      loanId?: string;
      dueDate?: string;
    }
  ) {
    const notifications = {
      requested: {
        type: 'loan_requested' as NotificationType,
        title: 'Demande de prêt soumise',
        message: `Votre demande de prêt de ${loanData?.amount || 0} USDC a été soumise et est en cours de révision.`
      },
      approved: {
        type: 'loan_approved' as NotificationType,
        title: 'Prêt approuvé',
        message: `Félicitations! Votre prêt de ${loanData?.amount || 0} USDC a été approuvé. Les fonds seront transférés sous peu.`
      },
      rejected: {
        type: 'loan_rejected' as NotificationType,
        title: 'Prêt rejeté',
        message: `Votre demande de prêt de ${loanData?.amount || 0} USDC a été rejetée. Veuillez réviser votre demande.`
      },
      disbursed: {
        type: 'loan_disbursed' as NotificationType,
        title: 'Prêt décaissé',
        message: `Votre prêt de ${loanData?.amount || 0} USDC a été transféré vers votre portefeuille. Date d'échéance: ${loanData?.dueDate || 'N/A'}.`
      }
    };

    const notification = notifications[status];
    
    await notificationService.sendNotification({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: {
        ...loanData,
        status,
        actionUrl: `/dashboard/farmer/loans${loanData?.loanId ? `/${loanData.loanId}` : ''}`
      }
    });
  }

  /**
   * Send repayment notifications
   */
  static async sendRepaymentNotification(
    userId: string,
    status: 'due' | 'overdue' | 'completed',
    repaymentData?: {
      amount?: number;
      dueDate?: string;
      loanId?: string;
      daysOverdue?: number;
    }
  ) {
    const notifications = {
      due: {
        type: 'repayment_due' as NotificationType,
        title: 'Remboursement à venir',
        message: `Rappel: Un remboursement de ${repaymentData?.amount || 0} USDC est dû le ${repaymentData?.dueDate || 'N/A'}.`
      },
      overdue: {
        type: 'repayment_overdue' as NotificationType,
        title: 'Remboursement en retard',
        message: `Attention: Votre remboursement de ${repaymentData?.amount || 0} USDC est en retard de ${repaymentData?.daysOverdue || 0} jour(s).`
      },
      completed: {
        type: 'repayment_completed' as NotificationType,
        title: 'Remboursement terminé',
        message: `Félicitations! Votre prêt a été entièrement remboursé. Vos tokens de garantie ont été libérés.`
      }
    };

    const notification = notifications[status];
    
    await notificationService.sendNotification({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: {
        ...repaymentData,
        status,
        actionUrl: `/dashboard/farmer/loans${repaymentData?.loanId ? `/${repaymentData.loanId}` : ''}`
      }
    });
  }

  /**
   * Send collateral release notification
   */
  static async sendCollateralReleaseNotification(
    userId: string,
    collateralData?: {
      tokenAmount?: number;
      loanId?: string;
    }
  ) {
    await notificationService.sendNotification({
      userId,
      type: 'collateral_released',
      title: 'Garantie libérée',
      message: `Vos tokens de garantie (${collateralData?.tokenAmount || 0} MazaoTokens) ont été libérés suite au remboursement complet de votre prêt.`,
      data: {
        ...collateralData,
        actionUrl: '/dashboard/farmer/portfolio'
      }
    });
  }

  /**
   * Send system maintenance notification
   */
  static async sendSystemMaintenanceNotification(
    userIds: string[],
    maintenanceData: {
      startTime: string;
      endTime: string;
      description: string;
    }
  ) {
    const promises = userIds.map(userId =>
      notificationService.sendNotification({
        userId,
        type: 'system_maintenance',
        title: 'Maintenance système programmée',
        message: `Maintenance prévue de ${maintenanceData.startTime} à ${maintenanceData.endTime}. ${maintenanceData.description}`,
        data: maintenanceData
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Send security alert notification
   */
  static async sendSecurityAlertNotification(
    userId: string,
    alertData: {
      alertType: string;
      description: string;
      actionRequired?: boolean;
    }
  ) {
    await notificationService.sendNotification({
      userId,
      type: 'security_alert',
      title: 'Alerte de sécurité',
      message: `${alertData.alertType}: ${alertData.description}${alertData.actionRequired ? ' Action requise.' : ''}`,
      data: {
        ...alertData,
        actionUrl: '/dashboard/profile'
      }
    });
  }

  /**
   * Send cooperative notifications for pending approvals
   */
  static async sendCooperativeNotification(
    cooperativeUserId: string,
    notificationType: 'farmer_registration' | 'evaluation_review' | 'loan_approval',
    data: {
      farmerName?: string;
      farmerId?: string;
      evaluationId?: string;
      loanId?: string;
      amount?: number;
    }
  ) {
    const notifications = {
      farmer_registration: {
        title: 'Nouvelle inscription d\'agriculteur',
        message: `${data.farmerName || 'Un agriculteur'} a soumis une demande d'inscription qui nécessite votre validation.`,
        actionUrl: '/dashboard/cooperative/farmers'
      },
      evaluation_review: {
        title: 'Évaluation à réviser',
        message: `${data.farmerName || 'Un agriculteur'} a soumis une évaluation de culture qui nécessite votre révision.`,
        actionUrl: `/dashboard/cooperative/evaluations${data.evaluationId ? `/${data.evaluationId}` : ''}`
      },
      loan_approval: {
        title: 'Demande de prêt à approuver',
        message: `${data.farmerName || 'Un agriculteur'} a demandé un prêt de ${data.amount || 0} USDC qui nécessite votre approbation.`,
        actionUrl: `/dashboard/cooperative/loans${data.loanId ? `/${data.loanId}` : ''}`
      }
    };

    const notification = notifications[notificationType];

    await notificationService.sendNotification({
      userId: cooperativeUserId,
      type: 'evaluation_submitted', // Using existing type for cooperative notifications
      title: notification.title,
      message: notification.message,
      data: {
        ...data,
        notificationType,
        actionUrl: notification.actionUrl
      }
    });
  }
}

export const notificationHelpers = NotificationHelpers;