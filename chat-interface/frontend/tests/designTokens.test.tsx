import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '../src/index.css';
import ChatPanel from '../src/components/ChatPanel';

const STUB_PROJECT = {
  id: 1,
  user_id: 1,
  name: 'Default',
  system_prompt: null,
  default_llm_provider_model: 'openai:gpt-x',
  is_user_default: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

describe('design tokens + glass scoping', () => {
  it('exposes the required custom properties on :root', () => {
    render(<div />);
    for (const name of [
      '--color-base',
      '--color-glass',
      '--color-amber',
      '--color-text',
      '--color-border',
      '--color-elevated',
      '--motion-fast',
      '--motion-base',
      '--motion-slow',
      '--ease-out',
    ]) {
      expect(readVar(name), `expected ${name} to be defined`).not.toBe('');
    }
  });

  it('--color-base is the dark base hex', () => {
    render(<div />);
    const v = readVar('--color-base').toLowerCase();
    expect(v).toContain('#0a0a0c');
  });

  it('exactly two rendered surfaces in the chat panel carry the .glass class', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/projects/1']}>
        <Routes>
          <Route path="/projects/:id" element={<ChatPanel project={STUB_PROJECT} />} />
        </Routes>
      </MemoryRouter>,
    );
    const glass = container.querySelectorAll('.glass');
    expect(glass.length).toBe(2);
    const testIds = Array.from(glass)
      .map((el) => el.getAttribute('data-testid'))
      .filter(Boolean)
      .sort();
    expect(testIds).toEqual(['chat-composer', 'chat-sidebar']);
  });
});
