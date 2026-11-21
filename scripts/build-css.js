/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');

const inputCss = `
@import 'tailwindcss';
@source './app/**/*.{ts,tsx}';
@source './components/**/*.{ts,tsx}';
@source './context/**/*.{ts,tsx}';
@source './lib/**/*.{ts,tsx}';

:root {
  --bg-slate: #f8fafc;
  --card-bg: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-slate: #e2e8f0;
  --gov-navy: #1e3a8a;
  --gov-blue: #0284c7;
}

body {
  background-color: #f8fafc;
  color: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-feature-settings: 'tnum' 1, 'zero' 1;
}

/* Crisp, minimal government portal cards */
.cafe-card, .gov-card {
  background-color: #ffffff;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.cafe-pill, .gov-pill {
  border-radius: 9999px;
  background-color: #f1f5f9;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border: 1px solid #e2e8f0;
  transition: all 0.15s ease;
}

.cafe-btn-dark, .gov-btn-primary {
  border-radius: 0.5rem;
  background-color: #0f172a;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  transition: all 0.15s ease;
}

.cafe-btn-dark:hover, .gov-btn-primary:hover {
  background-color: #1e293b;
}
`;

postcss([tailwind])
  .process(inputCss, { from: 'app/globals.css' })
  .then(res => {
    fs.writeFileSync('app/globals.css', res.css);
    console.log('Successfully compiled cafe-style Tailwind CSS into app/globals.css (bytes:', res.css.length, ')');
  })
  .catch(err => {
    console.error('CSS build error:', err);
    process.exit(1);
  });
