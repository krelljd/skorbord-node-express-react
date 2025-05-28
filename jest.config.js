export default {
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transformIgnorePatterns: ['/node_modules/'],
  extensionsToTreatAsEsm: ['.jsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};
