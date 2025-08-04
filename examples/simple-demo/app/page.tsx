'use client';

import { useComponentLogger } from '@yai-loglayer/next/client';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const logger = useComponentLogger('HomePage');
  const [count, setCount] = useState(0);

  useEffect(() => {
    logger.info('HomePage mounted');
  }, [logger]);

  const handleClick = () => {
    const newCount = count + 1;
    setCount(newCount);
    logger.info('Button clicked', { count: newCount });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Demo - @yai-loglayer/next</h1>
      <p>Count: {count}</p>
      <button onClick={handleClick}>
        Click me (logs to console)
      </button>
      <div style={{ marginTop: '20px' }}>
        <p>Open browser console to see logs!</p>
      </div>
    </div>
  );
}
