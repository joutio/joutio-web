import { FacebookLogoIcon, GoogleLogoIcon } from '@phosphor-icons/react'
import { Button, type ButtonProps } from './button'
import { useT } from '@/lib/i18n'

const PROVIDERS = {
  google: { icon: GoogleLogoIcon, label: 'ds.google' as const },
  facebook: { icon: FacebookLogoIcon, label: 'ds.facebook' as const },
}

export type SocialButtonProps = Pick<ButtonProps, 'onClick' | 'disabled' | 'loading' | 'className'> & {
  provider: keyof typeof PROVIDERS
}

export function SocialButton({ provider, ...props }: SocialButtonProps) {
  const t = useT()
  const { icon, label } = PROVIDERS[provider]
  return (
    <Button variant="gray" tone="neutral" full icon={icon} {...props}>
      {t(label)}
    </Button>
  )
}
