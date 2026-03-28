@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=Fredoka:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Quicksand", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Fredoka", sans-serif;
  
  --color-brand-50: #fff9f0;
  --color-brand-100: #fff1db;
  --color-brand-200: #ffe2b8;
  --color-brand-300: #ffc985;
  --color-brand-400: #ffa54d;
  --color-brand-500: #ff8c1a;
  --color-brand-600: #e67300;
  --color-brand-700: #cc6600;
  --color-brand-800: #b35900;
  --color-brand-900: #994d00;
  --color-brand-950: #4d2600;

  --color-cute-pink: #ff8a8a;
  --color-cute-mint: #a1eebd;
  --color-cute-yellow: #f6f7c4;
  --color-cute-blue: #7bd3ea;
}

@layer base {
  body {
    @apply bg-brand-50 text-brand-950 font-sans;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-display font-semibold;
  }
}

.markdown-body {
  @apply font-sans leading-relaxed;
}

.markdown-body h1 { @apply text-3xl font-bold mb-4 mt-6 font-display; }
.markdown-body h2 { @apply text-2xl font-bold mb-3 mt-5 font-display; }
.markdown-body h3 { @apply text-xl font-bold mb-2 mt-4 font-display; }
.markdown-body p { @apply mb-4; }
.markdown-body ul { @apply list-disc pl-6 mb-4; }
.markdown-body ol { @apply list-decimal pl-6 mb-4; }
.markdown-body li { @apply mb-1; }
