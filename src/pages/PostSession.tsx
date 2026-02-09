import { useLocation, useNavigate } from 'react-router-dom';
import { PostSessionIntegration } from '@/features/postSession/PostSessionIntegration';

export default function PostSession() {
  const navigate = useNavigate();
  const location = useLocation();

  const ctx = location.state;

  if (!ctx) {
    navigate('/', { replace: true });
    return null;
  }

  return <PostSessionIntegration initialContext={ctx} />;
}
