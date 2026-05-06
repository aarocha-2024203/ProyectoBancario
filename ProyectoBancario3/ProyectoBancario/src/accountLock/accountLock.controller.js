import AccountLock from './accountLock.model.js';

//agregar
export const createAccountLock = async (req, res) => {
    try {

        const accountData = req.body;

        /* if(req.file){
            const extension = req.file.path.split('.').pop();
            const filename = req.file.filename;
            const relativePath = filename.substring(filename.indexOf('fields/'));
        
            fieldData.photo = `$(relativePath).$(extension)`;
        }else{
            fieldData.photo = 'fields/kinal_sports_nyvxo5';
        }
 */
        const accountLock = new AccountLock(accountData);
        await accountLock.save();

        res.status(201).json({
            success: true,
            message: 'Cuenta bloqueada exitosamente',
            data: accountLock
        })

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al bloquear la cuenta',
            error: error.message
        })
    }
}
export const getAccountLocks = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'bloqueado' } = req.query;

        const filter = { status };

        const accountLocks = await AccountLock.find(filter)
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await AccountLock.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: accountLocks,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obetener los bloqueos de cuenta',
            error: error.message
        });
    }
};

export const getAccountLockById = async (req, res) => {
    try {
        const { id } = req.params;
        const accountLock = await AccountLock.findById(id);
        if (!accountLock) {
            return res.status(404).json({
                success: false,
                message: 'Bloqueo de cuenta no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            data: accountLock
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar el bloqueo de cuenta',
            error: error.message
        });
    }
};

export const updateAccountLock = async (req, res) => {
    try {
        const { id } = req.params;
        const accountLockData = req.body;
        
        const accountLock = await AccountLock.findByIdAndUpdate(
            id,
            accountLockData,
            { new: true, runValidators: true }
        );

        if (!accountLock) {
            return res.status(404).json({
                success: false,
                message: 'Bloqueo de cuenta no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bloqueo de cuenta actualizado exitosamente',
            data: accountLock
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el bloqueo de cuenta',
            error: error.message
        });
    }
}

export const deleteAccountLock = async (req, res) => {
    try {
        const { id } = req.params;
        const accountLock = await AccountLock.findByIdAndDelete(id);

        if (!accountLock) {
            return res.status(404).json({
                success: false,
                message: 'Bloqueo de cuenta no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bloqueo de cuenta eliminado exitosamente'
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar el bloqueo de cuenta',
            error: error.message
        });
    }
}