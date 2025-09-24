import React from 'react';
import { TestQueary } from '../features/test/testQueary.tsx';

const TestComponents = () => {
  const { data, error, isLoading } = TestQueary();
  if (isLoading) return <div>Loading...</div>;
  if (error instanceof Error) return <div>Error: {error.message}</div>;
  return (
    <div>
      <h2>Test Query Data:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default TestComponents;
