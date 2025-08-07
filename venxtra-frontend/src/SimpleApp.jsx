import React from 'react'

function SimpleApp() {
  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>VenXtra - Simple Test</h1>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          If you can see this, React is working properly!
        </p>
        <div style={{
          backgroundColor: '#e6f3ff',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #b3d9ff'
        }}>
          <strong>Status:</strong> Frontend is loading successfully ✅
        </div>
        <div style={{ marginTop: '20px' }}>
          <button 
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => alert('Button works!')}
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  )
}

export default SimpleApp