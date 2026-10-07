import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, () => {
  console.log('================================================================');
  console.log('  RegulaMap — AI Regulatory Drift Tracking Platform');
  console.log('================================================================');
  console.log(`  Backend API Server: http://localhost:${config.port}/api`);
  console.log(`  Health Check:       http://localhost:${config.port}/health`);
  console.log(`  Environment:        ${config.nodeEnv}`);
  console.log(`  Supabase URL:       ${config.supabaseUrl}`);
  console.log(`  Gemini Model:       gemini-2.5-flash`);
  console.log('================================================================');
});
