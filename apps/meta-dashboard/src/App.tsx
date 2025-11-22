import React from 'react';

const App: React.FC = () => {
  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <p className="dashboard__eyebrow">Meta Platform</p>
        <h1 className="dashboard__title">Meta Platform Dashboard</h1>
        <p className="dashboard__subtitle">
          Developer portal scaffold for managing projects, features, assets, and documentation.
        </p>
      </header>

      <section className="dashboard__section">
        <h2>Projects</h2>
        <ul>
          <li>Placeholder project entry</li>
          <li>Another project entry</li>
        </ul>
      </section>

      <section className="dashboard__section">
        <h2>Features</h2>
        <ul>
          <li>Placeholder feature</li>
          <li>Backlog item</li>
        </ul>
      </section>

      <section className="dashboard__section">
        <h2>Assets</h2>
        <ul>
          <li>Reusable component placeholder</li>
          <li>Documentation asset</li>
        </ul>
      </section>
    </main>
  );
};

export default App;
