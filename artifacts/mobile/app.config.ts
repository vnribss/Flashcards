import 'dotenv/config';

export default ({ config }: any): any => {
  const openrouterKey = process.env.VITE_OPENROUTER_KEY || process.env.OPENROUTER_KEY || '';

  return {
    ...config,
    extra: {
      ...config.extra,
      OPENROUTER_KEY: openrouterKey,
    },
  };
};