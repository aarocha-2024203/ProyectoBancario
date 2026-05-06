import Card from './cards.model.js';
import { User } from '../../../Auth-Service/src/users/user.model.js';
import { getUniqueCardNumber } from '../../helpers/card.helper.js';

// agregar
export const createCard = async (req, res) => {
    try {
        const cardData = req.body;
        cardData.userId = String(cardData.userId || '').trim();

        const user = await User.findOne({
            where: { Id: cardData.userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        cardData.cardNumber = await getUniqueCardNumber();

        const card = new Card(cardData);
        await card.save();

        return res.status(201).json({
            success: true,
            message: 'Tarjeta creada exitosamente',
            data: card
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al crear la tarjeta',
            error: error.message
        });
    }
};

export const getCards = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'activa' } = req.query;
        const filter = status ? { status } : {};
        const numericPage = parseInt(page, 10);
        const numericLimit = parseInt(limit, 10);

        const cards = await Card.find(filter)
            .limit(numericLimit)
            .skip((numericPage - 1) * numericLimit)
            .sort({ createdAt: -1 });

        const total = await Card.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: cards,
            pagination: {
                currentPage: numericPage,
                totalPages: Math.ceil(total / numericLimit),
                totalRecords: total,
                limit: numericLimit
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener las tarjetas',
            error: error.message
        });
    }
};

export const updateCard = async (req, res) => {
    try {
        const { id } = req.params;
        const cardData = { ...req.body };

        // Evitar que cambien el numero autogenerado por update
        delete cardData.cardNumber;

        if (cardData.userId) {
            cardData.userId = String(cardData.userId).trim();
            const user = await User.findOne({ where: { Id: cardData.userId } });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
        }

        const card = await Card.findByIdAndUpdate(
            id,
            cardData,
            { new: true, runValidators: true }
        );

        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Tarjeta no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tarjeta actualizada exitosamente',
            data: card
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al actualizar la tarjeta',
            error: error.message
        });
    }
};


export const deleteCard = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findByIdAndDelete(id);

        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Tarjeta no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tarjeta eliminada exitosamente'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al eliminar la tarjeta',
            error: error.message
        });
    }
};

export const getCardById = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterUserId = req.user?.sub || req.user?.userId || req.userId || '';
        const card = await Card.findById(id);

        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Tarjeta no encontrada'
            });
        }

        if (!requesterUserId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (String(card.userId) !== String(requesterUserId)) {
            return res.status(403).json({
                success: false,
                message: 'No puedes ver esta tarjeta'
            });
        }

        return res.status(200).json({
            success: true,
            data: card
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al buscar la tarjeta',
            error: error.message
        });
    }
};
export const changeCardStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowedStatus = ['activa', 'bloqueada', 'cancelada', 'vencida'];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no permitido'
            });
        }

        const card = await Card.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Tarjeta no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Tarjeta ${status} correctamente`,
            data: card
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al cambiar estado',
            error: error.message
        });
    }
};
