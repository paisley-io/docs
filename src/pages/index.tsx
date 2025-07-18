import React from 'react';
import Layout from '@theme/Layout';

export default function Home(): JSX.Element {
  return (
    <Layout title="Welcome to Paisley Docs" description="Documentation for the Paisley platform.">
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Welcome to Paisley</h1>
        <p>Explore the documentation using the sidebar.</p>
        <p>We're building a better financial system for real people.</p>
      </main>
    </Layout>
  );
}
