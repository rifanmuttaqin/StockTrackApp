export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type="submit"
            className={
                `inline-flex items-center rounded-md border border-transparent bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ink transition duration-150 ease-in-out hover:bg-brand-600 focus:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 active:bg-brand-700 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
