# TARA

An interactive field guide to the universe: a live 3D orrery of the solar system, planet dossiers, the scale of everything, cosmology and open questions in astronomy, astrophysics and astrobiology.

Built with Next.js 15, React 19, TypeScript and three.js. The interface uses a strict monochrome black palette; planet textures are rendered in greyscale.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Structure

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Page content, planetary data and sections |
| `app/orrery-3d.tsx` | three.js solar system simulation |
| `app/globals.css` | Theme tokens and all styling |
| `public/textures/` | NASA-derived surface maps |

## Data

Orbital data follows NASA planetary fact sheets and IAU values. Orbit radii are square-root compressed so the outer planets stay visible; orbital periods and start angles are real.

## Credits

Created by Sainandan and Mohan Teja.
