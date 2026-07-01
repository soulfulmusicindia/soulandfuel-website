# Soul & Fuel — Remotion project

A self-contained [Remotion](https://remotion.dev) project for producing video assets (intros, promo clips, animated titles) with React + code instead of a traditional video editor.

This lives entirely inside `remotion/` and is independent from the static site one level up — it has its own `package.json`/`node_modules` and doesn't add any dependency to the main site. Render a video here, export the `.mp4`, then drop it wherever the site needs it (e.g. as a hero background video or a YouTube upload).

## Setup

```
cd remotion
npm install
```

## Preview

```
npm start
```

Opens Remotion Studio, where you can scrub the timeline and see changes live as you edit files in `src/`.

## Render a video

```
npm run render -- MyComposition out/video.mp4
```

## Structure

```
src/index.ts         Entry point, registers the root
src/Root.tsx          Declares available compositions (id, duration, fps, size)
src/Composition.tsx   The actual video content (React component + Remotion hooks)
```

Add new videos by creating a new component and registering it with another `<Composition>` in `Root.tsx`.
