import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EditProfilePage } from './edit-profile-page'

// Pseudonyme antérieur aux règles (commence par un chiffre) : il ne doit pas bloquer l'enregistrement du reste.
const me = { userId: 'u1', pseudonym: '4me', bio: '', country: null, bannerUrl: null }

vi.mock('@/features/me', () => ({ useMe: () => ({ data: me }) }))
vi.mock('@/features/settings', () => ({
  usePseudonymCheck: (value: string, current: string | undefined) => (value.trim() === current ? { state: 'unchanged' } : { state: 'available' }),
  useUpdateMe: () => ({ mutateAsync: vi.fn() }),
  pseudonymError: () => undefined,
  pseudonymHint: () => '',
}))
vi.mock('@/shared/avatar', () => ({ useUserAvatar: () => undefined }))
vi.mock('@/lib/i18n', () => ({ useT: () => (key: string) => key, useLanguageStore: () => 'fr' }))

function renderPage() {
  const router = createMemoryRouter([{ path: '/me/edit', element: <EditProfilePage /> }], { initialEntries: ['/me/edit'] })
  render(<RouterProvider router={router} />)
  return { save: () => screen.getByRole('button', { name: 'settings.save' }), bio: () => screen.getByLabelText('settings.bio') }
}

describe('EditProfilePage', () => {
  afterEach(cleanup)

  it('enables Save as soon as a field changes, and disables it back at the saved value', async () => {
    const { save, bio } = renderPage()
    expect(save()).toHaveProperty('disabled', true)

    await act(async () => fireEvent.change(bio(), { target: { value: 'Passionné d’histoire' } }))
    expect(save()).toHaveProperty('disabled', false)

    await act(async () => fireEvent.change(bio(), { target: { value: '' } }))
    expect(save()).toHaveProperty('disabled', true)
  })
})
