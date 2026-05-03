# Liquid Glass Parallax

A live Three.js liquid-glass parallax interface built with Telecladius and Bles Software.

Live demo: https://teleclaudius.bles-software.com/liquid-glass-parallax

The page combines refractive glass panes, HTML-to-canvas typography capture, post-processing, a Bles Software lead form, and a GitHub CTA for people who want to fork the work or request AI integration, automation, harness access, or a custom visual effect build.

## Files

- `index.html` - the complete front-end demo and landing page.
- `leads-server.js` - small Node.js lead-capture endpoint used by the live site.

## Run Locally

Serve the directory with any static server, then open `index.html` in a modern browser with WebGL support.

```bash
python3 -m http.server 8080
```

For the optional contact endpoint:

```bash
PORT=9052 node leads-server.js
```

## Built With

- Three.js
- html2canvas
- d3-delaunay
- Telecladius
- Bles Software
