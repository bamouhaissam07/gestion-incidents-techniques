import React from 'react'
import ReactDOM from 'react-dom/client'

// Test simple sans tous les imports complexes
function TestApp() {
  return (
    <div style={{ padding: '20px', fontSize: '24px', color: 'blue' }}>
      <h1>🎉 TEST RÉUSSI !</h1>
      <p>Si tu vois ce message, React fonctionne !</p>
      <button onClick={() => alert('Bouton cliqué !')}>
        Teste ce bouton
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<TestApp />);