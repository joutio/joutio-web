import { FacebookLogoIcon, GoogleLogoIcon } from '@phosphor-icons/react'
import { Button, type ButtonProps } from './button'

const PROVIDERS = {
  google: { icon: GoogleLogoIcon, label: 'Continuer avec Google' },
  facebook: { icon: FacebookLogoIcon, label: 'Continuer avec Facebook' },
}

export type SocialButtonProps = Pick<ButtonProps, 'onClick' | 'disabled' | 'loading' | 'className'> & {
  provider: keyof typeof PROVIDERS
}

export function SocialButton({ provider, ...props }: SocialButtonProps) {
  const { icon, label } = PROVIDERS[provider]
  return (
    <Button variant="gray" tone="neutral" full icon={icon} {...props}>
      {label}
    </Button>
  )
}
