const defaultTheme = require('tailwindcss/defaultTheme');
const forms = require('@tailwindcss/forms');

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
    	extend: {
    		fontFamily: {
    			sans: [
    				'Poppins',
                    ...defaultTheme.fontFamily.sans
                ]
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		colors: {
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))',
    				50: '#eff6ff',
    				100: '#dbeafe',
    				200: '#bfdbfe',
    				300: '#93c5fd',
    				400: '#60a5fa',
    				500: '#3b82f6',
    				600: '#2563eb',
    				700: '#1d4ed8',
    				800: '#1e40af',
    				900: '#1e3a8a',
    				950: '#172554'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		spacing: {
    			'4px': '4px',
    			'8px': '8px',
    			'12px': '12px',
    			'16px': '16px',
    			'20px': '20px',
    			'24px': '24px',
    			'28px': '28px',
    			'32px': '32px',
    			'36px': '36px',
    			'40px': '40px',
    			'44px': '44px',
    			'48px': '48px',
    			'52px': '52px',
    			'56px': '56px',
    			'60px': '60px',
    			'64px': '64px',
    			'72px': '72px',
    			'80px': '80px',
    			'96px': '96px'
    		},
    		screens: {
    			'xs': '475px',
    			'sm': '640px',
    			'md': '768px',
    			'lg': '1024px',
    			'xl': '1280px',
    			'2xl': '1536px'
    		}
    	}
    },

    plugins: [forms, require("tailwindcss-animate")],
};
