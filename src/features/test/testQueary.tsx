import { useQuery } from '@tanstack/react-query';

let counter = 1;

export const TestQueary = () => {
  return useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      if (counter > 50) counter = 1;
      const url = `https://jsonplaceholder.typicode.com/todos/${counter}`;
      counter++;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    refetchInterval: 10000,
  });
};
