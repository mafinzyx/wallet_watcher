import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchInterval: 1000 * 60, // 30 seconds
    },
  },
});

export { QueryClientProvider };
