import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
/* SQI — global mobile width safety net */
html, body, #root {
  overflow-x: hidden;
  max-width: 100vw;
}

* {
  min-width: 0;
}

@media (max-width: 768px) {
  [class*="message"],
  [class*="bubble"],
  [class*="chat"] > * {
    max-width: 100% !important;
    overflow-wrap: break-word;
    word-break: break-word;
  }
}
