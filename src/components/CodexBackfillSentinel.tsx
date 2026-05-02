/**
 * CodexBackfillSentinel — mounted once at the app root. Whenever the user
 * is authenticated, it sweeps any SQI replies that never made it into the
 * Akashic Codex (e.g. tab closed mid-stream, network blip during the live
 * curator call) and replays them silently. This guarantees that no SQI
 * reply that lives in `sqi_sessions` can be missing from the Codex.
 */
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { syncPendingTransmissionsOnce } from '@/lib/codex/codexSync';

export const CodexBackfillSentinel: React.FC = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.id) void syncPendingTransmissionsOnce(user.id);
  }, [user?.id]);
  return null;
};
