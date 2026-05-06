import Notification from './notifications.model.js';

export const createNotification = async (req, res) => {
    try {
        const notificationData = req.body;
        
        if (!notificationData.status) {
            notificationData.status = 'activa';
        }
        
        const notification = new Notification(notificationData);
        await notification.save();

        res.status(201).json({
            success: true,
            message: 'Notificación creada exitosamente',
            data: notification
        })

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear la notificación',
            error: error.message
        })
    }
}

export const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10, channel = 'email' } = req.query;
        const filter = { channel };

        const notifications = await Notification.find(filter)
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Notification.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: notifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit)
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las notificaciones',    
            error: error.message
        })
    }
}

export const getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar la notificación',
            error: error.message
        });
    }
}

export const updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notificationData = req.body;
        
        const notification = await Notification.findByIdAndUpdate(
            id,
            notificationData,
            { new: true, runValidators: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notificación actualizada exitosamente',
            data: notification
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la notificación',
            error: error.message
        });
    }
}

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notificación eliminada exitosamente'
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar la notificación',
            error: error.message
        });
    }
}

export const changeNotificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatus = ['activa', 'inactiva'];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no permitido'
            });
        }

        const notification = await Notification.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: `Notificación ${status} correctamente`,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado',
            error: error.message
        });
    }
}