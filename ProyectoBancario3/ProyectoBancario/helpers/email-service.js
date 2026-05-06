import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 10_000,
    greetingTimeout:   10_000,
    socketTimeout:     10_000,
    tls: { rejectUnauthorized: false },
});

const FROM = `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`;

/**
 * Envía el estado de cuenta como PDF adjunto al correo del usuario autenticado.
 *
 * @param {Object} params
 * @param {string} params.email         - Correo destino  (req.user.email)
 * @param {string} params.name          - Nombre del usuario (req.user.name)
 * @param {Buffer} params.pdfBuffer     - Buffer del PDF generado
 * @param {string} params.accountNumber - Número de cuenta (para el nombre del adjunto)
 * @param {Date}   params.periodStart   - Inicio del periodo
 * @param {Date}   params.periodEnd     - Fin del periodo
 */
export const sendAccountStatementEmail = async ({
    email,
    name,
    pdfBuffer,
    accountNumber,
    periodStart,
    periodEnd,
}) => {
    const fmtDate  = (d) => new Date(d).toLocaleDateString('es-GT');
    const filename = `estado-de-cuenta-${accountNumber}.pdf`;

    await transporter.sendMail({
        from:    FROM,
        to:      email,
        subject: `Estado de Cuenta - Cuenta ${accountNumber}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">

                <div style="background-color:#182060;padding:24px;border-radius:8px 8px 0 0;">
                    <h2 style="color:#d2a52c;margin:0;text-align:center;">Kinal Banks</h2>
                    <h3 style="color:#ffffff;margin:8px 0 0;text-align:center;">Estado de Cuenta</h3>
                </div>

                <div style="background:#f9f9f9;padding:24px;border:1px solid #e0e0e0;">
                    <p>Estimado/a <strong>${name}</strong>,</p>
                    <p>
                        Adjunto encontrarás tu estado de cuenta correspondiente al periodo del
                        <strong>${fmtDate(periodStart)}</strong> al <strong>${fmtDate(periodEnd)}</strong>
                        para la cuenta <strong>${accountNumber}</strong>.
                    </p>
                    <p>Si tienes alguna pregunta sobre los movimientos reflejados, no dudes en contactarnos.</p>
                    <p style="margin-top:24px;color:#888;font-size:12px;">
                        Este documento fue generado electrónicamente y no requiere firma ni sello.<br/>
                        Por favor no respondas a este correo.
                    </p>
                </div>

                <div style="background-color:#182060;padding:12px;border-radius:0 0 8px 8px;text-align:center;">
                    <span style="color:#d2a52c;font-size:12px;">
                        © ${new Date().getFullYear()} Kinal Banks — Todos los derechos reservados
                    </span>
                </div>

            </div>
        `,
        attachments: [
            {
                filename,
                content:     pdfBuffer,
                contentType: 'application/pdf',
            },
        ],
    });
};