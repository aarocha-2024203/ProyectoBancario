'use strict';

import { getBenefits } from './benefits.model.js';

export const listFranchiseBenefits = (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Por ser usuario de nuestro banco tienes descuentos en tiendas fisicas',
            data: getBenefits()
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener beneficios exclusivos',
            error: error.message
        });
    }
};
