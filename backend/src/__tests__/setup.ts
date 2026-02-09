// Jest setup file
jest.setTimeout(10000);

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_KEY = 'test_key_123';
process.env.PORT = '8000';

// Suppress console errors during tests (optional)
global.console.error = jest.fn();
