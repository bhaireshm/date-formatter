import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  preset: "ts-jest",
  collectCoverage: true,
  coverageReporters: ["json", "text", "lcov", "clover"],
};

export default config;

