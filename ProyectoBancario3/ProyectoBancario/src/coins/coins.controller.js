import Currency from './coins.model.js';

//agregar
export const createCurrency = async (req, res) => {
    try {

        const currencyData = req.body;

        /* if(req.file){
             const extension = req.file.path.split('.').pop();
             const filename = req.file.filename;
             const relativePath = filename.substring(filename.indexOf('fields/'));
         
             fieldData.photo = `$(relativePath).$(extension)`;
         }else{
             fieldData.photo = 'fields/kinal_sports_nyvxo5';
         }
 */
        const currency = new Currency(currencyData);
        await currency.save();

        res.status(201).json({
            success: true,
            message: 'Moneda creada exitosamente',
            data: currency
        })

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear la moneda',
            error: error.message
        })
    }
}

export const getCurrencies = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'activa' } = req.query;
        const filter = { status };
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        }

        const currencies = await Currency.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(options.sort);
        const total = await Currency.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: currencies,
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
            message: 'Error al obtener las monedas',
            error: error.message
        })
    }

}

export const updateCurrency = async (req, res) => {
    try {
        const { id } = req.params;
        const currencyData = req.body;
        const currency = await Currency.findByIdAndUpdate(
            id,
            currencyData,
            { new: true, runValidators: true }
        );

        if (!currency) {
            return res.status(404).json({
                success: false,
                message: 'Moneda no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Moneda actualizada exitosamente',
            data: currency
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la moneda',
            error: error.message
        });
    }
}

export const deleteCurrency = async (req, res) => {
    try {
        const { id } = req.params;
        const currency = await Currency.findByIdAndDelete(id);

        if (!currency) {
            return res.status(404).json({
                success: false,
                message: 'Moneda no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Moneda eliminada exitosamente'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar la moneda',
            error: error.message
        });
    }
}

export const getCurrencyById = async (req, res) => {
    try {
        const { id } = req.params;
        const currency = await Currency.findById(id);
        if (!currency) {
            return res.status(404).json({
                success: false,
                message: 'Moneda no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: currency
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar la moneda',
            error: error.message
        });
    }
};


export const changeCurrencyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validar estados permitidos
        const allowedStatus = ['activa', 'inactiva'];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no permitido'
            });
        }

        const currency = await Currency.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!currency) {
            return res.status(404).json({
                success: false,
                message: 'Moneda no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: `Moneda ${status} correctamente`,
            data: currency
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado',
            error: error.message
        });
    }
};