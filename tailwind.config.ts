import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // VS Code inspired color palette
        editor: {
          bg: 'var(--editor-bg)',
          fg: 'var(--editor-fg)',
          line: 'var(--editor-line)',
          selection: 'var(--editor-selection)',
          comment: 'var(--editor-comment)',
          keyword: 'var(--editor-keyword)',
          string: 'var(--editor-string)',
          function: 'var(--editor-function)',
          variable: 'var(--editor-variable)',
          number: 'var(--editor-number)',
        },
        sidebar: {
          bg: 'var(--sidebar-bg)',
          fg: 'var(--sidebar-fg)',
          hover: 'var(--sidebar-hover)',
          active: 'var(--sidebar-active)',
        },
        tabs: {
          bg: 'var(--tabs-bg)',
          active: 'var(--tabs-active)',
          border: 'var(--tabs-border)',
        },
        terminal: {
          bg: 'var(--terminal-bg)',
          fg: 'var(--terminal-fg)',
        },
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'code': ['13px', '1.5'],
      },
      spacing: {
        'sidebar': '260px',
        'tabs': '35px',
        'statusbar': '22px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
