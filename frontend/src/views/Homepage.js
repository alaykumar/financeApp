import React from 'react';

function Homepage() {
  return (
    <div>
      <main role="main" style={{ marginTop: 50, textAlign: 'center' }}>
        <div className="container">
          <h1>Welcome!</h1>
          <a className="btn btn-primary" href="#" role="button">
            Learn More
          </a>
        </div>
      </main>
      <footer style={{ textAlign: 'center', marginTop: 50 }}>
        <p>© Company 2024</p>
      </footer>
    </div>
  );
}

export default Homepage;
