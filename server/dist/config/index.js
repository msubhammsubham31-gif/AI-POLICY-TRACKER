"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'regulamap-enterprise-secret-key-super-secure-32chars',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/regulamap?schema=public',
    supabaseUrl: process.env.SUPABASE_URL || 'https://xniukiwokjkafyxymcpc.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    appUrl: process.env.APP_URL || 'http://localhost:5173',
};
