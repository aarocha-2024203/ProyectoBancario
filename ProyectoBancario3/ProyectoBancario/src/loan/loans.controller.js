import Loan from './loans.model.js';
import Account from '../accounts/accounts.model.js';

//agregar
export const createLoan = async (req, res) => {
    try {

        const loanData = req.body;
        
        const loan = new Loan(loanData);
        await loan.save();

        res.status(201).json({
            success: true,
            message: 'Préstamo creado exitosamente',
            data: loan
        })

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear el préstamo',
            error: error.message
        })
    }
}

export const getLoans = async (req, res) => {
    try {
        const { page = 1, limit = 100, status } = req.query;
const filter = status ? { status } : {};
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        }

        const loans = await Loan.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(options.sort);
        const total = await Loan.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: loans,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el préstamo',    
            error: error.message
        })
    }
}

export const getLoanById = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterRole = req.user?.role;
        const requesterUserId = req.user?.sub || req.user?.userId || req.userId || '';

        const loan = await Loan.findById(id);
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Préstamo no encontrado'
            });
        }

        // Si el solicitante es un usuario normal, asegurar que el préstamo le pertenece
        if (requesterRole === 'USER_ROLE') {
            if (String(loan.userId) !== String(requesterUserId)) {
                // Listar los préstamos del usuario
                const ownLoans = await Loan.find({ userId: requesterUserId }).select('_id').limit(20);
                const loanIds = ownLoans.map(l => String(l._id));
                const idsText = loanIds.length > 0 ? loanIds.join(',') : 'ninguno';

                return res.status(403).json({
                    success: false,
                    message: `tus prestamos son idPrestamo: ${idsText}`
                });
            }
        }

        res.status(200).json({
            success: true,
            data: loan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar el préstamo',
            error: error.message
        });
    }
};

export const updateLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const loanData = req.body;
        const requesterRole   = req.user?.role;
        const requesterUserId = req.user?.sub || req.user?.userId || req.userId || '';

        const existingLoan = await Loan.findById(id);
        if (!existingLoan) {
            return res.status(404).json({
                success: false,
                message: 'Préstamo no encontrado'
            });
        }

        if (requesterRole === 'USER_ROLE') {
            if (String(existingLoan.userId) !== String(requesterUserId)) {
                const ownLoans = await Loan.find({ userId: requesterUserId }).select('_id').limit(20);
                const loanIds  = ownLoans.map(l => String(l._id));
                const idsText  = loanIds.length > 0 ? loanIds.join(',') : 'ninguno';
                return res.status(403).json({
                    success: false,
                    message: `tus prestamos son idPrestamo: ${idsText}`
                });
            }
        }

        // Si el status cambia a 'desembolsado' y antes no lo era
        // → suma el approvedAmount al balance de la cuenta
        const wasNotDisbursed = existingLoan.status !== 'desembolsado';
        const isNowDisbursed  = loanData.status === 'desembolsado';

        if (wasNotDisbursed && isNowDisbursed) {
            const amountToAdd = Number(loanData.approvedAmount || existingLoan.approvedAmount || 0);
            const accountNumber = loanData.accountNumber || existingLoan.accountNumber;

            if (amountToAdd > 0 && accountNumber) {
                const account = await Account.findOne({ accountNumber });
                if (account) {
                    account.balance = Number(Number(account.balance + amountToAdd).toFixed(2));
                    await account.save();
                    console.log(`[Loan] Desembolso de Q${amountToAdd} a cuenta ${accountNumber}. Nuevo balance: Q${account.balance}`);
                }
            }
        }

        const loan = await Loan.findByIdAndUpdate(
            id,
            loanData,
            { new: true, runValidators: true }
        );

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Préstamo no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: isNowDisbursed && wasNotDisbursed
                ? `Préstamo desembolsado exitosamente. Q${loanData.approvedAmount || existingLoan.approvedAmount} acreditados a la cuenta.`
                : 'Préstamo actualizado exitosamente',
            data: loan
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el préstamo',
            error: error.message
        });
    }
};

export const deleteLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const loan = await Loan.findByIdAndDelete(id);

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Préstamo no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Préstamo eliminado exitosamente'
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar el préstamo',
            error: error.message
        });
    }
}

export const getMyLoans = async (req, res) => {
    try {
        const userId = req.user?.sub || req.user?.userId || '';
        if (!userId) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }
        const loans = await Loan.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: loans });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener préstamos',
            error: error.message
        });
    }
};