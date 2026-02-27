import { Router } from 'express';
import {
    getTransactions,
    getTransactionById,
    getLastTransactionsByAccount,
    createTransfer,
    createDeposit,
    reverseDeposit
} from './transaction.controller.js';

const router = Router();

router.get('/', getTransactions);
router.get('/account/:accountId/last', getLastTransactionsByAccount);
router.get('/:id', getTransactionById);

router.post('/transfer', createTransfer);
router.post('/deposit', createDeposit);
router.post('/reverse/:transactionId', reverseDeposit);

export default router;