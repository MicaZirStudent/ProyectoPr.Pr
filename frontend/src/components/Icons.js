export const BuildingIcon = ({ size = 22, stroke = 1.8 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <rect x="4" y="3" width="16" height="18" rx="1.5" />
        <path d="M9 21V8h6v13" />
        <path d="M9 12h6M9 16h6" />
    </svg>
);

export const SquareIcon = ({ size = 22, stroke = 1.8 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <rect x="8" y="8" width="8" height="8" rx="1.5" fill="currentColor" stroke="none" />
    </svg>
);
