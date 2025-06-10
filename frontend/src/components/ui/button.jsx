"use client";
export default function Button({className='', children, ...props}) {
  return (
    <button className={`px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 ${className}`} {...props}>
      {children}
    </button>
  );
}
