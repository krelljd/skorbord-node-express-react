import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Create root element for React
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

// Tell Jest to mock the main module
jest.mock('./src/main.jsx');
