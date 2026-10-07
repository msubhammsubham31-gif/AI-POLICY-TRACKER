"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const app = (0, app_1.createApp)();
app.listen(config_1.config.port, () => {
    console.log('================================================================');
    console.log('  RegulaMap — AI Regulatory Drift Tracking Platform');
    console.log('================================================================');
    console.log(`  Backend API Server: http://localhost:${config_1.config.port}/api`);
    console.log(`  Health Check:       http://localhost:${config_1.config.port}/health`);
    console.log(`  Environment:        ${config_1.config.nodeEnv}`);
    console.log(`  Supabase URL:       ${config_1.config.supabaseUrl}`);
    console.log(`  Gemini Model:       gemini-2.5-flash`);
    console.log('================================================================');
});
