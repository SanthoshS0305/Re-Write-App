import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSetActiveSignUp = vi.fn()
const mockSignUpCreate = vi.fn()
const mockSignUpAuthWithRedirect = vi.fn()

vi.mock('@clerk/nextjs/legacy', () => ({
  useSignUp: () => ({
    signUp: {
      create: mockSignUpCreate,
      authenticateWithRedirect: mockSignUpAuthWithRedirect,
    },
    isLoaded: true,
    setActive: mockSetActiveSignUp,
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

import SignupPage from '@/app/signup/page'

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email, password, repeat password, first name, and last name inputs', () => {
    render(<SignupPage />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Repeat Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument()
  })

  it('renders Create Account submit button', () => {
    render(<SignupPage />)
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })

  it('renders Continue with Google button', () => {
    render(<SignupPage />)
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument()
  })

  it('renders a link to /login for existing users', () => {
    render(<SignupPage />)
    const link = screen.getByRole('link', { name: /Log In/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/login')
  })

  it('shows Passwords do not match error when passwords differ', async () => {
    const user = userEvent.setup()
    render(<SignupPage />)

    await user.type(screen.getByPlaceholderText('Username'), 'testuser')
    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.type(screen.getByPlaceholderText('Repeat Password'), 'differentpassword')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
    expect(mockSignUpCreate).not.toHaveBeenCalled()
  })

  it('shows error from Clerk on failed signup', async () => {
    const clerkError = { errors: [{ message: 'Email address is already taken.' }] }
    mockSignUpCreate.mockRejectedValueOnce(clerkError)
    const user = userEvent.setup()
    render(<SignupPage />)

    await user.type(screen.getByPlaceholderText('Username'), 'testuser')
    await user.type(screen.getByPlaceholderText('Email'), 'existing@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.type(screen.getByPlaceholderText('Repeat Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(screen.getByText('Email address is already taken.')).toBeInTheDocument()
    })
  })

  it('shows generic error when Clerk error has no message', async () => {
    mockSignUpCreate.mockRejectedValueOnce({})
    const user = userEvent.setup()
    render(<SignupPage />)

    await user.type(screen.getByPlaceholderText('Username'), 'testuser')
    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.type(screen.getByPlaceholderText('Repeat Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument()
    })
  })

  it('calls router.push with /dashboard on successful signup', async () => {
    mockSignUpCreate.mockResolvedValueOnce({ status: 'complete', createdSessionId: 'sess_new_456' })
    mockSetActiveSignUp.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<SignupPage />)

    await user.type(screen.getByPlaceholderText('Username'), 'newuser')
    await user.type(screen.getByPlaceholderText('Email'), 'newuser@example.com')
    await user.type(screen.getByPlaceholderText('First Name'), 'New')
    await user.type(screen.getByPlaceholderText('Last Name'), 'User')
    await user.type(screen.getByPlaceholderText('Password'), 'securepass123')
    await user.type(screen.getByPlaceholderText('Repeat Password'), 'securepass123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(mockSetActiveSignUp).toHaveBeenCalledWith({ session: 'sess_new_456' })
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows Signup failed error when status is not complete', async () => {
    mockSignUpCreate.mockResolvedValueOnce({ status: 'missing_requirements', createdSessionId: null })
    const user = userEvent.setup()
    render(<SignupPage />)

    await user.type(screen.getByPlaceholderText('Username'), 'testuser')
    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.type(screen.getByPlaceholderText('Repeat Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(screen.getByText('Signup failed. Please try again.')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('calls authenticateWithRedirect with oauth_google when Google button clicked', async () => {
    const user = userEvent.setup()
    render(<SignupPage />)

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }))

    expect(mockSignUpAuthWithRedirect).toHaveBeenCalledWith({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  })

  it('shows loading state while account creation is in progress', async () => {
    let resolveCreate: (value: unknown) => void
    mockSignUpCreate.mockImplementationOnce(
      () => new Promise((resolve) => { resolveCreate = resolve })
    )
    const user = userEvent.setup()
    render(<SignupPage />)

    await user.type(screen.getByPlaceholderText('Username'), 'testuser')
    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.type(screen.getByPlaceholderText('Repeat Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creating account.../i })).toBeInTheDocument()
    })

    resolveCreate!({ status: 'complete', createdSessionId: 'sess_xyz' })
  })
})
