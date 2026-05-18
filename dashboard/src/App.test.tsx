import { render } from '@testing-library/react';        // ← Bỏ screen vì không dùng
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './contexts/app-context';
import App from './App';

describe('App rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );
    console.log("RENDERED HTML:", container.innerHTML);
    expect(container).not.toBeEmptyDOMElement();
  });
});