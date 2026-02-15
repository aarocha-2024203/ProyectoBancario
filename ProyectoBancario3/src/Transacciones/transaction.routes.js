import { Router } from 'express';
import {
    getTransactions,
    getTransactionById,
    getLastTransactionsByAccount,
    createTransfer,
    createDeposit,
    reverseDeposit,
    getAccountsWithMostTransactions
} from './transaction.controller.js';

const router = Router();

router.get('/', getTransactions);
router.get('/most-movements', getAccountsWithMostTransactions);
router.get('/:id', getTransactionById);
router.get('/account/:accountId/last', getLastTransactionsByAccount);

router.post('/transfer', createTransfer);
router.post('/deposit', createDeposit);
router.post('/deposit/:transactionId/reverse', reverseDeposit);

export default router;