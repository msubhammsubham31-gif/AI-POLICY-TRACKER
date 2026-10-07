"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const apiRoutes_1 = __importDefault(require("./routes/apiRoutes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
function createApp() {
    const app = (0, express_1.default)();
    // Security Middleware
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Allow client scripts & MapLibre tiles
    }));
    app.use((0, cors_1.default)({
        origin: '*',
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // API Routes
    app.use('/api', apiRoutes_1.default);
    // Health check
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            app: 'RegulaMap — AI Regulatory & Environmental Compliance Drift Tracking Platform',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        });
    });
    // Serve static client in production if built
    const clientDistPath = path_1.default.join(__dirname, '..', '..', 'client', 'dist');
    if (fs_1.default.existsSync(clientDistPath)) {
        app.use(express_1.default.static(clientDistPath));
        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api'))
                return next();
            res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
        });
    }
    // Centralized Error Handler
    app.use(errorMiddleware_1.errorHandler);
    return app;
}
