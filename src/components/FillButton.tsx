import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'invert' | 'onDark' | 'solid'

const VARIANTS: Record<Variant, string> = {
  primary: '',
  ghost: 'btn--ghost',
  invert: 'btn--invert',
  onDark: 'btn--on-dark',
  solid: 'btn--solid',
}

type CommonProps = {
  children: string
  variant?: Variant
  /** Icône facultative, posée à côté du libellé — elle ne participe pas à l'échange. */
  icon?: ReactNode
  iconPosition?: 'start' | 'end'
  className?: string
}

type ButtonProps = CommonProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof CommonProps> & { href?: undefined }

type LinkProps = CommonProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof CommonProps> & { href: string }

  
export function FillButton(props: ButtonProps | LinkProps) {
  const {
    children,
    variant = 'primary',
    icon,
    iconPosition = 'start',
    className = '',
    ...rest
  } = props
  const classes = ['btn', 'fx-4', VARIANTS[variant], className].filter(Boolean).join(' ')

  const mark = icon ? (
    <span className="btn-icon" aria-hidden="true">
      {icon}
    </span>
  ) : null

  const content = (
    <>
      {iconPosition === 'start' && mark}
      <span className="btn-label" data-label={children}>
        {children}
      </span>
      {iconPosition === 'end' && mark}
    </>
  )

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest as ComponentPropsWithoutRef<'a'>

    return (
      <a href={href} className={classes} {...anchorProps}>
        {content}
      </a>
    )
  }

  const { type = 'button', ...buttonProps } = rest as ComponentPropsWithoutRef<'button'>

  return (
    <button type={type} className={classes} {...buttonProps}>
      {content}
    </button>
  )
}
