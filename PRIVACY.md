# Privacy policy

**NeoAmp does not collect, store, transmit, or sell any personal data.**

NeoAmp runs entirely on your machine. It has no servers, no analytics, no telemetry,
and no accounts.

## What it accesses (and why)

- **Audio of the current tab** — captured via `chrome.tabCapture` only while you have
  the player/EQ open, used locally to drive the equalizer and the visualizer. Audio is
  processed in memory in real time and is **never recorded, stored, or sent anywhere**.
- **Now-playing metadata** (title / artist / artwork) — read locally from the page's
  standard `navigator.mediaSession` to display in the player. Stays on your device.
- **Your settings** (chosen skin, EQ bands, window positions) — stored locally via
  `chrome.storage`. Never leaves your device.

## Network requests

**None.** NeoAmp makes no outbound network requests. All code and assets are bundled in the
extension, and nothing is fetched from or sent to any server.

## Permissions

| Permission | Why |
| --- | --- |
| `tabCapture` | Capture the tab's audio for the EQ + visualizer. |
| `offscreen` | Run the audio graph in an offscreen document (MV3 requirement). |
| `storage` | Save your settings locally. |
| `activeTab` / `contextMenus` | UI interactions and lifecycle. |
| Host access to `music.youtube.com`, `open.spotify.com` | Inject the player UI on supported sites. |

## Contact

Questions about privacy? Open an issue on the project's GitHub repository.

_Last updated: 2026-06-28._
