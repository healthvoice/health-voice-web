/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type FieldProps = {
  className?: string;
  classInput?: string;
  label?: string;
  textarea?: boolean;
  note?: string;
  type?: string;
  value: string;
  onChange: any;
  placeholder?: string;
  required?: boolean;
  icon?: string;
  disabled?: boolean;
  Svg?: ReactNode;
  maxLength?: number;
  invalid?: boolean;
  autoComplete?: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  name?: string;
};

const Field = ({
  className,
  classInput,
  label,
  textarea,
  note,
  type,
  value,
  disabled,
  onChange,
  placeholder,
  required,
  icon,
  Svg,
  maxLength,
  invalid,
  autoComplete,
  inputMode,
  name,
}: FieldProps) => {
  const handleKeyDown = (event: any) => {
    const remainingChars = 880 - value.length;
    if (remainingChars <= 0 && event.key !== "Backspace") {
      event.preventDefault();
    }
  };

  const remainingChars = 880 - value.length;

  return (
    <div className={`${className}`}>
      <div className="relative">
        {label && (
          <div className="mb-0.5 flex font-semibold 2xl:mb-2 text-gray-700">
            {label}
            {textarea && (
              <span className="ml-auto pl-4 text-gray-400">{remainingChars}</span>
            )}
          </div>
        )}
        <div className="relative">
          {Svg && (
            <div className="pointer-events-none absolute top-0 bottom-0 left-4 flex items-center justify-center text-gray-400">
              {Svg}
            </div>
          )}
          {textarea ? (
            <textarea
              className={twMerge(
                `h-24 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 ${(icon || Svg) && "pl-[3.125rem]"
                } ${invalid && "border-red-500 focus:border-red-500 focus:ring-red-500/20"}`,
                classInput,
              )}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              maxLength={maxLength}
            ></textarea>
          ) : (
            <input
              className={twMerge(
                `h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${(icon || Svg) && "pl-[3.125rem]"
                } ${invalid && "border-red-500 focus:border-red-500 focus:ring-red-500/20"}`,
                classInput,
              )}
              type={type || "text"}
              autoCapitalize="off"
              autoComplete={autoComplete}
              inputMode={inputMode}
              name={name}
              value={value}
              onChange={onChange}
              disabled={disabled}
              placeholder={placeholder}
              required={required}
              maxLength={maxLength}
            />
          )}
        </div>
        {note && <div className="mt-2 text-xs text-gray-500">{note}</div>}
      </div>
    </div>
  );
};

export default Field;
