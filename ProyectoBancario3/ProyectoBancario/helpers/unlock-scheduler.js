import AccountLock from '../src/accountLock/accountLock.model.js';
import Account     from '../src/accounts/accounts.model.js';

export const startUnlockScheduler = () => {
  setInterval(async () => {
    try {
      const now = new Date();

      // Solo desbloquea si unlockDate existe, no es null y ya pasó
      const expired = await AccountLock.find({
        status:     'bloqueado',
        unlockDate: {
          $exists: true,
          $ne:     null,
          $lte:    now,
        },
      });

      for (const lock of expired) {
        await AccountLock.findByIdAndUpdate(lock._id, {
          status:     'desbloqueado',
          unlockedBy: 'sistema',
        });
        await Account.findOneAndUpdate(
          { accountNumber: lock.accountId },
          { status: 'activa' }
        );
        console.log(`[Scheduler] Cuenta ${lock.accountId} desbloqueada automáticamente`);
      }

      if (expired.length > 0) {
        console.log(`[Scheduler] ${expired.length} cuenta(s) desbloqueada(s)`);
      }
    } catch(err) {
      console.error('[Scheduler] Error:', err.message);
    }
  }, 10_000);

  console.log('[Scheduler] Desbloqueo automático activo');
};