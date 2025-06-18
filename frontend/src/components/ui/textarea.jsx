"use client";
export default function Textarea({className='', ...props}) {
  return (
    <textarea className={`border rounded px-3 py-2 ${className}`} {...props} />
  );
}
