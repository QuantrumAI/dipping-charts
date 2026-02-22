# Contributing to dipping-charts

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/QuantrumAI/dipping-charts.git
cd dipping-charts
npm install
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run demo` | Launch interactive demo |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run type-check` | TypeScript type checking |
| `npm run build` | Build the library |

## Making Changes

1. Fork the repository and create your branch from `main`.
2. Make your changes and add tests if applicable.
3. Run `npm test` and `npm run type-check` to verify your changes.
4. Commit with a clear message describing your changes.
5. Open a pull request.

## Code Style

- TypeScript for all source files
- Functional components for React
- Keep dependencies minimal — the library should only peer-depend on `lightweight-charts` and optionally `react`/`react-dom`

## Adding a New Indicator

1. Create `src/indicators/yourIndicator.ts`
2. Export it from `src/indicators/index.ts`
3. Add tests in `src/__tests__/indicators.test.ts`
4. Add UI integration in `IndicatorSettings.tsx` and locale strings in `locale.ts`

## Adding a New Locale

1. Add your translations to `src/react/locale.ts`
2. Add the locale key to the `Locale` type
3. Test with `<FullFeaturedChart locale="xx" />`

## Reporting Issues

- Use [GitHub Issues](https://github.com/QuantrumAI/dipping-charts/issues)
- Include browser, OS, and reproduction steps

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
