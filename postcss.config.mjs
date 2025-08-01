const config = {
  plugins: {
    '@tailwindcss/postcss': {
      // Enable Tailwind v4 features including @theme
      config: './tailwind.config.ts',
      // Ensure @theme directive is processed
      theme: true,
    },
  },
};

export default config;
