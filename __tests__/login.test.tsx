import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSetActive = vi.fn()
const mockCreate = vi.fn()
const mockAuthenticateWithRedirect = vi.fn()

vi.mock('@clerk/nextjs/legacy', () => ({
  useSignIn: () => ({
    signIn: { create: mockCreate, authenticateWithRedirect: mockAuthenticateWithRedirect },
    isLoaded: true,
    setActive: mockSetActive,
  }),
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import LoginPage from '@/app/login/page'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('renders Login submit button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
  })

  it('renders Continue with Google button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument()
  })

  it('renders No Account link pointing to /signup', () => {
    render(<LoginPage />)
    const link = screen.getByRole('link', { name: /Create One/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/signup')
  })

  it('shows error message when signIn.create throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Invalid credentials'))
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })

  it('calls router.push with /dashboard on successful sign-in', async () => {
    mockCreate.mockResolvedValueOnce({ status: 'complete', createdSessionId: 'sess_123' })
    mockSetActive.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'correctpassword')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(mockSetActive).toHaveBeenCalledWith({ session: 'sess_123' })
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error when sign-in result status is not complete', async () => {
    mockCreate.mockResolvedValueOnce({ status: 'needs_second_factor', createdSessionId: null })
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'somepassword')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('calls authenticateWithRedirect with oauth_google strategy when Google button clicked', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }))

    expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  })

  it('shows loading state while submitting', async () => {
    let resolveCreate: (value: unknown) => void
    mockCreate.mockImplementationOnce(
      () => new Promise((resolve) => { resolveCreate = resolve })
    )
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Signing in.../i })).toBeInTheDocument()
    })

    resolveCreate!({ status: 'complete', createdSessionId: 'sess_abc' })
  })

  it('submit button is disabled when isLoaded is false', () => {
    vi.doMock('@clerk/nextjs/legacy', () => ({
      useSignIn: () => ({
        signIn: { create: mockCreate, authenticateWithRedirect: mockAuthenticateWithRedirect },
        isLoaded: false,
        setActive: mockSetActive,
      }),
    }))

    render(<LoginPage />)
    const submitButton = screen.getByRole('button', { name: /Login|Signing in/i })
    expect(submitButton).not.toBeDisabled()
  })
})
