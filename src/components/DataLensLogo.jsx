function DataLensLogo({ size = 36 }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-blue-600 shadow-sm"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Data bars */}
        <rect x="3" y="11" width="5" height="10" rx="1.2" fill="white" />
        <rect x="9.5" y="6" width="5" height="15" rx="1.2" fill="white" />
        <rect x="16" y="2" width="5" height="19" rx="1.2" fill="white" />
      </svg>
    </div>
  );
}

export default DataLensLogo;