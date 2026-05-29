import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Registration now happens automatically on first Google Sign-In.
// Redirect to /login, preserving plan/billing params for post-login flow.
export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    navigate(`/login${params ? `?${params}` : ''}`, { replace: true });
  }, [navigate, searchParams]);

  return null;
}
