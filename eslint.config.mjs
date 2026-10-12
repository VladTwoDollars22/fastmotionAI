import { config } from "@remotion/eslint-config-flat";

const utilsOverride = {
  files: ["src/utils/**/*.{ts,tsx}"],
  rules: {
    "@remotion/non-pure-animation": "off",
  },
};

export default Array.isArray(config)
  ? [...config, utilsOverride]
  : [config, utilsOverride];
