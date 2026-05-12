import Card from './cards.model.js';
import { getUniqueCardNumber } from '../../helpers/card.helper.js';

const getUserById = async (userId) => {
    const response = await fetch(`http://bancario_auth:3005/api/v1/auth/profile-by-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.data : null;
};

// Usuario solicita una tarjeta
export const requestCard = async (req, res) => {
    try {
        const userId = req.user?.sub || req.user?.userId || '';
        const { cardType, requestNote, franchise } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (!cardType || !['debito','credito'].includes(cardType)) {
            return res.status(400).json({ success: false, message: 'Tipo de tarjeta inválido' });
        }

        // Verifica que no tenga ya una solicitud pendiente del mismo tipo
        const existing = await Card.findOne({ userId, cardType, status: 'pendiente' });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Ya tienes una solicitud pendiente de tarjeta ${cardType}`
            });
        }

        const card = new Card({
            userId,
            cardType,
            requestNote: requestNote || '',
            franchise:   franchise || 'VISA',
            status:      'pendiente',
            availableBalance: 0,
        });

        await card.save();

        return res.status(201).json({
            success: true,
            message: 'Solicitud de tarjeta enviada exitosamente',
            data: card
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al solicitar la tarjeta',
            error: error.message
        });
    }
};

// Admin aprueba una solicitud
export const approveCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { creditLimit, availableBalance, expirationDate, pin, cvv, franchise, adminNote } = req.body;

        const card = await Card.findById(id);
        if (!card) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (card.status !== 'pendiente') {
            return res.status(400).json({ success: false, message: 'Esta solicitud ya fue procesada' });
        }

        card.cardNumber      = await getUniqueCardNumber();
        card.cvv             = cvv || '000';
        card.pin             = pin || '0000';
        card.expirationDate  = expirationDate || new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000);
        card.availableBalance= Number(availableBalance) || 1000;
        card.creditLimit     = card.cardType === 'credito' ? (Number(creditLimit) || 5000) : undefined;
        card.franchise       = franchise || card.franchise || 'VISA';
        card.adminNote       = adminNote || '';
        card.status          = 'activa';
        card.issueDate       = new Date();

        await card.save();

        return res.status(200).json({
            success: true,
            message: 'Tarjeta aprobada y activada exitosamente',
            data: card
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al aprobar la tarjeta',
            error: error.message
        });
    }
};

// Admin rechaza una solicitud
export const rejectCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNote } = req.body;

        const card = await Card.findById(id);
        if (!card) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (card.status !== 'pendiente') {
            return res.status(400).json({ success: false, message: 'Esta solicitud ya fue procesada' });
        }

        card.status    = 'rechazada';
        card.adminNote = adminNote || '';
        await card.save();

        return res.status(200).json({
            success: true,
            message: 'Solicitud rechazada',
            data: card
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al rechazar la solicitud',
            error: error.message
        });
    }
};

// Obtener solicitudes pendientes (admin)
export const getPendingCards = async (req, res) => {
    try {
        const cards = await Card.find({ status: 'pendiente' }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: cards });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al obtener solicitudes', error: error.message });
    }
};

export const getMyCards = async (req, res) => {
    try {
        const userId = req.user?.sub || req.user?.userId || '';
        if (!userId) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }
        const cards = await Card.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: cards });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener tarjetas',
            error: error.message
        });
    }
};

export const createCard = async (req, res) => {
    try {
        const cardData = req.body;
        cardData.userId = String(cardData.userId || '').trim();

        const user = await getUserById(cardData.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        cardData.cardNumber = await getUniqueCardNumber();
        const card = new Card(cardData);
        await card.save();

        return res.status(201).json({ success: true, message: 'Tarjeta creada exitosamente', data: card });
    } catch (error) {
        return res.status(400).json({ success: false, message: 'Error al crear la tarjeta', error: error.message });
    }
};

export const getCards = async (req, res) => {
    try {
        const { page = 1, limit = 100, status } = req.query;
        // Si no se pasa status, trae TODAS
        const filter = status ? { status } : {};
        const numericPage  = parseInt(page, 10);
        const numericLimit = parseInt(limit, 10);

        const cards = await Card.find(filter)
            .limit(numericLimit)
            .skip((numericPage - 1) * numericLimit)
            .sort({ createdAt: -1 });

        const total = await Card.countDocuments(filter);

        return res.status(200).json({
            success: true, data: cards,
            pagination: {
                currentPage: numericPage,
                totalPages:  Math.ceil(total / numericLimit),
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
        delete cardData.cardNumber;

        const card = await Card.findByIdAndUpdate(id, cardData, { new: true, runValidators: true });
        if (!card) {
            return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
        }
        return res.status(200).json({ success: true, message: 'Tarjeta actualizada exitosamente', data: card });
    } catch (error) {
        return res.status(400).json({ success: false, message: 'Error al actualizar la tarjeta', error: error.message });
    }
};

export const deleteCard = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findByIdAndDelete(id);
        if (!card) {
            return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
        }
        return res.status(200).json({ success: true, message: 'Tarjeta eliminada exitosamente' });
    } catch (error) {
        return res.status(400).json({ success: false, message: 'Error al eliminar la tarjeta', error: error.message });
    }
};

export const getCardById = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterUserId = req.user?.sub || req.user?.userId || '';
        const card = await Card.findById(id);
        if (!card) return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
        if (String(card.userId) !== String(requesterUserId)) {
            return res.status(403).json({ success: false, message: 'No puedes ver esta tarjeta' });
        }
        return res.status(200).json({ success: true, data: card });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al buscar la tarjeta', error: error.message });
    }
};

export const changeCardStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowedStatus = ['activa', 'bloqueada', 'cancelada', 'vencida'];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ success: false, message: 'Estado no permitido' });
        }
        const card = await Card.findByIdAndUpdate(id, { status }, { new: true });
        if (!card) return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
        return res.status(200).json({ success: true, message: `Tarjeta ${status} correctamente`, data: card });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al cambiar estado', error: error.message });
    }
};

