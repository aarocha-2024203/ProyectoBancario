import dotenv from 'dotenv';

dotenv.config();

const parseCsv = (value) =>
    value ? value.split(',').map((item) => item.trim()) : [];

const hoursToMs = (value, fallbackHours) =>
    (value ? parseInt(value, 10) : fallbackHours) * 60 * 60 * 1000;

export const config = {
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
    },

    // SMTP Configuration (aligned with .NET SmtpSettings)
    smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        enableSsl: process.env.SMTP_ENABLE_SSL === 'true',
        username: process.env.SMTP_USERNAME,
        password: process.env.SMTP_PASSWORD,
        fromEmail: process.env.EMAIL_FROM,
        fromName: process.env.EMAIL_FROM_NAME,
    },

    // File Upload Configuration (aligned with .NET FileValidator)
    upload: {
        maxSize: 5 * 1024 * 1024, // 5MB (aligned with .NET)
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], // aligned with .NET
        uploadPath: process.env.UPLOAD_PATH,
    },

    // Cloudinary Configuration
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        baseUrl: process.env.CLOUDINARY_BASE_URL,
        folder: process.env.CLOUDINARY_FOLDER,

        defaultAvatar: process.env.CLOUDINARY_DEFAULT_AVATAR_FILENAME,
        defaultAvatarPath:
        process.env.CLOUDINARY_DEFAULT_AVATAR &&
        !process.env.CLOUDINARY_DEFAULT_AVATAR.includes('${')
            ? process.env.CLOUDINARY_DEFAULT_AVATAR
            : [
                process.env.CLOUDINARY_FOLDER,
                process.env.CLOUDINARY_DEFAULT_AVATAR_FILENAME,
            ]
                .filter(Boolean)
                .join('/'),
    },

    // Rate Limiting (aligned with .NET AuthPolicy and ApiPolicy)
    rateLimit: {
        // General API rate limiting (aligned with .NET ApiPolicy: 20 tokens per minute)
        windowMs: 1 * 60 * 1000, // 1 minute
        maxRequests: 20,
        // Auth endpoints rate limiting (aligned with .NET AuthPolicy: 5 requests per minute)
        authWindowMs: 1 * 60 * 1000, // 1 minute
        authMaxRequests: 5,
        // Email endpoints rate limiting (more restrictive for security)
        emailWindowMs: 15 * 60 * 1000, // 15 minutes
        emailMaxRequests: 3,
    },

    // Security (aligned with .NET Security configuration)
    security: {
        saltRounds: 12,
        maxLoginAttempts: 5,
        lockoutTime: 30 * 60 * 1000,
        passwordMinLength: 8,
        // IP Filtering (aligned with .NET IpFilteringMiddleware)
        blacklistedIPs: parseCsv(process.env.BLACKLISTED_IPS),
        whitelistedIPs: parseCsv(process.env.WHITELISTED_IPS),
        restrictedPaths: parseCsv(process.env.RESTRICTED_PATHS),
    },

    // App Settings (aligned with .NET AppSettings)
    app: {
        frontendUrl: process.env.FRONTEND_URL,
    },

    // Security Settings (aligned with .NET Security config)
    cors: {
        allowedOrigins: parseCsv(process.env.ALLOWED_ORIGINS),
        adminAllowedOrigins: parseCsv(process.env.ADMIN_ALLOWED_ORIGINS),
    },

    // Verification tokens
    verification: {
        // Read expirations from env (hours) for easy configuration and parity with .NET
        emailTokenExpiry: hoursToMs(process.env.VERIFICATION_EMAIL_EXPIRY_HOURS, 24),
        passwordResetExpiry: hoursToMs(process.env.PASSWORD_RESET_EXPIRY_HOURS, 1),
    },
};
