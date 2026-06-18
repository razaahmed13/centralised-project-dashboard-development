import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectLinkButton } from './project-link-button';

const credentialLink = {
  id: 'link-1',
  label: 'Open project',
  url: 'https://tokenwatch-xi.vercel.app/',
  kind: 'primary',
  hasCredentials: true,
  sortOrder: 0,
};

describe('ProjectLinkButton', () => {
  const writeText = vi.fn();
  const open = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('open', open);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });
    writeText.mockResolvedValue(undefined);
  });

  it('copies credentials before opening the project so clipboard keeps focus permission', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ formatted: 'neodym\ntokenwatch-dashboard-ashar-2026' }),
    } as Response);

    render(<ProjectLinkButton link={credentialLink} />);

    fireEvent.click(screen.getByRole('button', { name: /open & copy credentials/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('neodym\ntokenwatch-dashboard-ashar-2026'));
    await waitFor(() => expect(open).toHaveBeenCalledWith(credentialLink.url, '_blank', 'noopener,noreferrer'));

    expect(writeText.mock.invocationCallOrder[0]).toBeLessThan(open.mock.invocationCallOrder[0]);
    expect(screen.getByText(/credentials copied/i)).toBeInTheDocument();
  });

  it('still opens the project and shows fallback text when clipboard write fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ formatted: 'Project: Token Watcher\nPassword: secret' }),
    } as Response);
    writeText.mockRejectedValue(new DOMException('Document is not focused.', 'NotAllowedError'));

    render(<ProjectLinkButton link={credentialLink} />);

    fireEvent.click(screen.getByRole('button', { name: /open & copy credentials/i }));

    await waitFor(() => expect(open).toHaveBeenCalledWith(credentialLink.url, '_blank', 'noopener,noreferrer'));
    expect(await screen.findByText(/manual copy fallback/i)).toBeInTheDocument();
    expect(screen.getByText(/use manual copy below/i)).toBeInTheDocument();
  });
});
