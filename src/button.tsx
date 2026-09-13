import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonVariant = 'standard' | 'accent' | 'quiet'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'standard', className = '', type = 'button', children, ...props },
  ref,
) {
  const variantClass = variant === 'standard' ? '' : ' ' + variant
  const classes = 'button' + variantClass + (className ? ' ' + className : '')
  return <button ref={ref} type={type} className={classes} {...props}>{children}</button>
})
