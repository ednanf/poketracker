# Project Overview

This repository contains a full-stack web application. The frontend is built with React and configured as a PWA. The
backend is a Node.js/Express.js REST API backed by MongoDB.

## Tech Stack & Tooling

- **Languages:** TypeScript, JavaScript (ES6+)
- **Frontend:** React, CSS Modules, Responsive Design
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Auth & Security:** JWT Authentication, Helmet, CORS
- **Tooling:** Git, Zod (validation), ESLint, Prettier, tsx

## Coding Standards

- **TypeScript:** Write strict TypeScript. Absolutely do not use `any`, as the ESLint configuration strictly forbids it.
  Rely on Zod for runtime type validation where applicable.
- **Frontend:** Build mobile-first responsive designs. Scope CSS using CSS Modules rather than global stylesheets or
  inline styles.
- **Backend:** Keep REST APIs clean and stateless. Handle token verification securely via JWT.

## Commands

- Install dependencies: `yarn install`
- Start dev server: `yarn dev`
- Lint code: `yarn lint`