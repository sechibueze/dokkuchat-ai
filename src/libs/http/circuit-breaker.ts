import { logger } from '@/config/logger';
import CircuitBreaker from 'opossum';

export function createCircuitBreaker<TArgs extends unknown[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
  name: string,
) {
  const breaker = new CircuitBreaker(operation, {
    // The breaker timeout must be longer than the total time allowed for the protected operation.
    // Since retries can multiply the total duration, ensure the timeout and retry budget are designed together.
    timeout: 35_000,
    errorThresholdPercentage: 50,
    resetTimeout: 30_000,
    rollingCountTimeout: 60_000,
    rollingCountBuckets: 10,
    volumeThreshold: 10,
  });

  breaker.on('open', () => {
    logger.warn('Circuit breaker opened', { name });
  });

  breaker.on('halfOpen', () => {
    logger.info('Circuit breaker half-open', { name });
  });

  breaker.on('close', () => {
    logger.info('Circuit breaker closed', { name });
  });

  return breaker;
}
