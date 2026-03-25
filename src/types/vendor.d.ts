/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── next-themes ────────────────────────────────────────────────────────────
declare module 'next-themes' {
  import { ReactNode } from 'react';

  interface ThemeProviderProps {
    children: ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    enableColorScheme?: boolean;
    storageKey?: string;
    themes?: string[];
    forcedTheme?: string;
    value?: Record<string, string>;
  }

  function ThemeProvider(props: ThemeProviderProps): JSX.Element;
  function useTheme(): {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    resolvedTheme: string | undefined;
    themes: string[];
    systemTheme: string | undefined;
    forcedTheme: string | undefined;
  };

  export { ThemeProvider, useTheme, ThemeProviderProps };
}

declare module 'next-themes/dist/types' {
  export interface ThemeProviderProps {
    children: React.ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    enableColorScheme?: boolean;
    storageKey?: string;
    themes?: string[];
    forcedTheme?: string;
    value?: Record<string, string>;
  }
}

// ─── react-hook-form ────────────────────────────────────────────────────────
declare module 'react-hook-form' {
  export interface FieldValues {
    [key: string]: any;
  }

  export interface UseFormReturn<T extends FieldValues = FieldValues> {
    register: (name: keyof T, options?: any) => any;
    handleSubmit: (onValid: (data: T) => void | Promise<void>, onInvalid?: (errors: any) => void) => (e?: React.BaseSyntheticEvent) => Promise<void>;
    formState: {
      errors: Record<string, { message?: string; type?: string }>;
      isSubmitting: boolean;
      isValid: boolean;
      isDirty: boolean;
      isSubmitted: boolean;
      touchedFields: Record<string, boolean>;
      dirtyFields: Record<string, boolean>;
    };
    watch: (name?: string | string[]) => any;
    setValue: (name: keyof T, value: any, options?: any) => void;
    getValues: (name?: string | string[]) => any;
    reset: (values?: Partial<T>) => void;
    trigger: (name?: string | string[]) => Promise<boolean>;
    control: any;
    setError: (name: keyof T, error: any) => void;
    clearErrors: (name?: string | string[]) => void;
  }

  export interface UseFormProps<T extends FieldValues = FieldValues> {
    resolver?: any;
    defaultValues?: Partial<T>;
    mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
    reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  }

  export function useForm<T extends FieldValues = FieldValues>(props?: UseFormProps<T>): UseFormReturn<T>;
}

// ─── @hookform/resolvers/zod ────────────────────────────────────────────────
declare module '@hookform/resolvers/zod' {
  import type { ZodType } from 'zod';
  export function zodResolver(schema: ZodType<any>): any;
}
